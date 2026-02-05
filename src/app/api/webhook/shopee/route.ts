import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, getShopClient } from '@/lib/shopee';
import { db } from '@/db';
import { products, orders, logs, orderItems, shops } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get('Authorization') || '';
        const url = req.url;

        // TODO: We need the partner key to verify. 
        // For now, assuming single partner operation from env.
        const partnerKey = process.env.SHOPEE_PARTNER_KEY || 'YOUR_PARTNER_KEY';

        if (!verifyWebhookSignature({ url, body: bodyText, signature, partnerKey })) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = JSON.parse(bodyText);
        const { code, shop_id, data } = payload;

        // Log the webhook
        await db.insert(logs).values({
            action: 'WEBHOOK_RECEIVED',
            shopId: undefined, // Need to verify if we have this shop in DB first
            requestPayload: payload,
            responseStatus: 200
        });

        // 1. ORDER STATUS UPDATE
        if (code === 3 && data.status === 'READY_TO_SHIP') {
            await processOrder(shop_id, data.ordersn);
        }

        // 2. NEW CHAT MESSAGE
        if (code === 4) { // msg_content
            // Handle chat logic
        }

        // 3. SHOP RATING
        if (data && data.comment_id && data.rating_star) {
            await processRating(shop_id, data);
        }

        return NextResponse.json({ message: 'OK' });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function processRating(shopId: number, data: any) {
    const client = await getShopClient(shopId);
    const ratingStar = data.rating_star; // 1-5
    const commentId = data.comment_id;

    // TODO: Fetch template from DB based on store settings
    // For MVP, using static templates
    const templates: Record<number, string> = {
        5: "Terima kasih banyak atas bintang 5nya kak! ⭐⭐⭐⭐⭐ Semoga produknya bermanfaat. Ditunggu orderan selanjutnya ya! 🙏",
        4: "Terima kasih kak! ⭐⭐⭐⭐ Jika ada kendala, jangan ragu chat kami ya. Kami siap bantu!",
        3: "Mohon maaf jika ada kekurangan kak. 🙏 Silakan chat kami agar kami bisa bantu selesaikan masalahnya.",
        2: "Mohon maaf atas ketidaknyamanannya. 😔 Tolong info kami via chat apa yang kurang, kami akan tanggung jawab.",
        1: "Ya ampun, maaf banget kak membuat kecewa. 😭 Tolong chat kami, kami ganti 100% atau refund jika produk bermasalah."
    };

    const reply = templates[ratingStar] || templates[5];

    // Send reply
    await client.replyComment(commentId, reply);

    // Log it
    await db.insert(logs).values({
        action: 'BOOST_EXECUTED', // Using generic action to avoid schema error for now
        responsePayload: { message: `Replied to ${ratingStar} star rating` }
    });
}

async function processOrder(shopId: number, orderSn: string) {
    const client = await getShopClient(shopId);

    // 1. Fetch Details
    const details = await client.getOrderDetail([orderSn]);
    const orderData = details.response.order_list[0];
    const items = orderData.item_list;
    const buyerId = orderData.buyer_user_id;

    // 2. Lookup Products & Send Chats
    for (const item of items) {
        const product = await db.query.products.findFirst({
            where: (products, { eq, and }) => and(
                eq(products.sku, item.item_sku),
                eq(products.shopeeItemId, item.item_id)
            )
        });

        if (product && product.downloadLink && product.isActive) {
            // Replace placeholder in template
            const message = product.templateMessage?.replace('{link}', product.downloadLink) || product.downloadLink;

            // Send Chat
            await client.sendMessage(buyerId, message);

            // Record in logs
            await db.insert(logs).values({
                action: 'CHAT_SENT',
                orderSn: orderSn,
                responsePayload: { message: `Sent link for ${item.item_sku}` }
            });
        }
    }

    // 3. Ship Order (Auto-Fulfill)
    // "Jasa Kirim Toko" requires tracking number. Use OrderSN.
    await client.shipOrder(orderSn);

    // 4. Save to DB
    await db.insert(orders).values({
        orderSn: orderSn,
        shopId: (await db.query.shops.findFirst({ where: eq(shops.shopId, shopId) }))?.id!, // Safety needed
        buyerId: buyerId,
        buyerUsername: orderData.buyer_username,
        status: 'SHIPPED',
        processedAt: new Date()
    }).onConflictDoUpdate({
        target: orders.orderSn,
        set: { status: 'SHIPPED', processedAt: new Date() }
    });
}

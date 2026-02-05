import { NextResponse } from 'next/server';
import { db } from '@/db';
import { shops, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getShopClient } from '@/lib/shopee';

export async function POST(req: Request) {
    try {
        // TODO: Get shop_id from user session or query param
        // For now, getting the first active shop
        const shop = await db.query.shops.findFirst({
            where: eq(shops.isActive, true)
        });

        if (!shop) {
            return NextResponse.json({ error: 'No active shop found' }, { status: 404 });
        }

        const client = await getShopClient(shop.shopId);

        // Fetch items from Shopee
        // Note: Logic to handle pagination if > 50 items
        const response = await client.getItemList(0, 50, 'NORMAL');
        const items = response.response.item; // Shopee returns { response: { item: [...] } }

        if (!items || items.length === 0) {
            return NextResponse.json({ message: 'No items found on Shopee', count: 0 });
        }

        let syncedCount = 0;

        for (const item of items) {
            // Shopee item structure: { item_id, item_sku, ... }
            // Note: getItemList might return basic info, creating need for getItemBaseInfo for names if not provided.
            // Assuming simplified response for this MVP or that item_name is in the list response (check docs)
            // Verified: v2.product.get_item_list returns item_id, item_status, item_sku, update_time
            // We might need get_item_base_info for names.

            // Upsert product
            await db.insert(products).values({
                shopId: shop.id,
                shopeeItemId: item.item_id,
                sku: item.item_sku || `NO-SKU-${item.item_id}`,
                name: `Shopee Product ${item.item_id}`, // Placeholder until we detail fetch
                downloadLink: '',
                isActive: true
            }).onConflictDoUpdate({
                target: [products.shopId, products.sku], // Start using the new composite key logic or handle shopeeItemId uniqueness
                // Actually shopeeItemId should be unique globally for a shop, but our schema enforces shopId+sku.
                // NOTE: Using onConflictDoNothing to avoid overwriting existing mappings (links/templates)
                // If we want to update names/SKUs, we should select fields to update.
                set: {
                    shopeeItemId: item.item_id,
                    updatedAt: new Date()
                    // Don't overwrite downloadLink or templateMessage
                }
            });
            syncedCount++;
        }

        return NextResponse.json({ success: true, count: syncedCount });
    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

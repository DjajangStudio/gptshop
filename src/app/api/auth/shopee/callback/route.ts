import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema'; // Ensure you have shops table imported
import { ShopeeClient } from '@/lib/shopee';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const shopIdStr = searchParams.get('shop_id');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error: `Shopee Auth Error: ${error}` }, { status: 400 });
    }

    if (!code || !shopIdStr) {
        return NextResponse.json({ error: 'Missing code or shop_id' }, { status: 400 });
    }

    try {
        const partnerId = parseInt(process.env.SHOPEE_PARTNER_ID || '0');
        const partnerKey = process.env.SHOPEE_PARTNER_KEY || '';
        const shopId = parseInt(shopIdStr);

        if (!partnerId || !partnerKey) {
            throw new Error("Missing Partner Credentials");
        }

        // 1. Exchange Code for Token
        const tokenData = await ShopeeClient.getAccessToken(partnerId, partnerKey, code, shopId);

        // 2. Save/Update in DB
        // Check if shop exists (by shopId) to support multi-shop or re-auth
        // We use shopId (bigint) as unique key

        // First, check if we have a user associated. For now, we might rely on a "default" user or just upsert.
        // Since we don't have a logged-in session context easily here (unless we used state param),
        // we will assume a single-user system or find the shop if it exists.

        // Strategy: 
        // If shop exists, update tokens.
        // If shop does not exist, we need a userId. 
        // fallback: Pick the first user in DB (Admin) or reject.

        const existingShop = await db.query.shops.findFirst({
            where: eq(shops.shopId, shopId)
        });

        if (existingShop) {
            await db.update(shops).set({
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenExpiresAt: new Date(Date.now() + (tokenData.expire_in * 1000)),
                isActive: true, // Re-enable if disabled
                updatedAt: new Date()
            }).where(eq(shops.shopId, shopId));
        } else {
            // New Shop Connection
            // Find a user to attach to
            const user = await db.query.users.findFirst();
            if (!user) {
                // If no user exists, maybe creating one via seed is needed, or we error out
                return NextResponse.json({ error: 'System Error: No user account found to attach shop. Please sign up first.' }, { status: 500 });
            }

            await db.insert(shops).values({
                userId: user.id,
                shopId: shopId,
                shopName: `Shop ${shopId}`, // Placeholder, fetch details later
                partnerId: partnerId.toString(),
                partnerKey: partnerKey,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenExpiresAt: new Date(Date.now() + (tokenData.expire_in * 1000)),
                isActive: true,
                settings: {
                    autoFulfillment: true,
                    autoReply: true,
                    autoRating: false, // Safer default
                    autoBoost: true
                }
            });
        }

        // 3. Redirect to Dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url));

    } catch (err: any) {
        console.error("Auth Callback Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

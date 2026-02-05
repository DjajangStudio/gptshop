import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ShopeeClient } from '@/lib/shopee';

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
        console.log(`Exchanging code for shop ${shopId}...`);
        const tokenData = await ShopeeClient.getAccessToken(partnerId, partnerKey, code, shopId);
        console.log("Token received:", tokenData);

        // 2. Save/Update in Firestore
        const shopsRef = adminDb.collection('shops');
        const snapshot = await shopsRef.where('shopeeShopId', '==', shopId).limit(1).get();

        const tokenExpires = new Date(Date.now() + (tokenData.expire_in * 1000));

        if (!snapshot.empty) {
            // Update existing shop
            const docId = snapshot.docs[0].id;
            await shopsRef.doc(docId).update({
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenExpiresAt: tokenExpires,
                isActive: true,
                updatedAt: new Date()
            });
            console.log(`Updated shop ${shopId} (Doc ID: ${docId})`);
        } else {
            // Create New Shop
            // Since we don't have a user session yet, we create an 'orphan' shop or assign to a default admin
            // Ideally, you should implement state parameter to pass userId

            await shopsRef.add({
                userId: 'admin_placeholder', // TODO: Fix with real Auth
                shopeeShopId: shopId,
                shopName: `Shop ${shopId}`,
                partnerId: partnerId.toString(),
                partnerKey: partnerKey,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenExpiresAt: tokenExpires,
                isActive: true,
                createdAt: new Date(),
                settings: {
                    autoFulfillment: true,
                    autoReply: true,
                    autoBoost: true
                }
            });
            console.log(`Created new shop document for ${shopId}`);
        }

        // 3. Redirect to Dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url));

    } catch (err: any) {
        console.error("Auth Callback Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

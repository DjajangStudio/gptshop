import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyWebhookSignature } from '@/lib/shopee';

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();
        const url = req.url;
        const signature = req.headers.get('authorization') || '';

        // 1. Verify Signature
        // Ideally we need to find WHICH shop this is for to get the partner key.
        // Shopee webhooks usually contain shop_id in the body.
        const bodyJson = JSON.parse(bodyText);
        const shopId = bodyJson.shop_id;

        if (!shopId) {
            return NextResponse.json({ error: 'Missing shop_id' }, { status: 400 });
        }

        // Fetch Shop to get Partner Key
        const shopSnap = await adminDb.collection('shops').where('shopeeShopId', '==', shopId).limit(1).get();
        if (shopSnap.empty) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }
        const shopData = shopSnap.docs[0].data();
        const partnerKey = shopData.partnerKey;

        const isValid = verifyWebhookSignature({
            url,
            body: bodyText,
            signature,
            partnerKey
        });

        if (!isValid) {
            // Shopee Retry Policy: if we return 401, they retry.
            // For Sandbox, sometimes signature logic is tricky (http vs https).
            // We log but might accept it if in debugging mode.
            console.error('Invalid Webhook Signature');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Process Event
        const code = bodyJson.code; // e.g., 3 (Order Status Update)

        // Log webhook to Firestore
        await adminDb.collection('webhook_logs').add({
            shopId,
            code,
            payload: bodyJson,
            timestamp: new Date()
        });

        // Handle specific events (like Order Update)
        // ... switch(code) ...

        return NextResponse.json({ message: 'OK' });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

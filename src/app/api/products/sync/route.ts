import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getShopClient } from '@/lib/shopee';

export async function POST(req: NextRequest) {
    try {
        const { shopId } = await req.json();

        if (!shopId) {
            return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
        }

        // 1. Get Client
        // We assume getShopClient is already refactored to use Firestore (checked in previous step)
        const client = await getShopClient(shopId);

        // 2. Fetch Products from Shopee
        // pagination loop would go here
        const response = await client.getItemList(0, 50);
        const itemList = response.response.item_list;

        if (!itemList || itemList.length === 0) {
            return NextResponse.json({ message: 'No products found' });
        }

        // 3. Batch Write to Firestore
        const batch = adminDb.batch();
        const productsRef = adminDb.collection('shops').doc(String(shopId)).collection('products');

        for (const item of itemList) {
            const docRef = productsRef.doc(String(item.item_id));
            batch.set(docRef, {
                shopeeItemId: item.item_id,
                name: item.item_name, // Note: getItemList might return minimal info, detail need another call
                status: item.item_status,
                updatedAt: new Date()
            }, { merge: true });
        }

        await batch.commit();

        return NextResponse.json({
            success: true,
            syncedCount: itemList.length
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

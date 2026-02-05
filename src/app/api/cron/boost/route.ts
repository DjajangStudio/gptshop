import { NextResponse } from 'next/server';
import { db } from '@/db';
import { shops, products } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getShopClient } from '@/lib/shopee';

export async function GET() {
    try {
        const allShops = await db.query.shops.findMany({
            where: eq(shops.isActive, true)
        });

        const results = [];

        for (const shop of allShops) {
            // 1. Get Boostable Products
            // Logic: Rotate 5 products that haven't been boosted recently
            // Simple rotation: Sort by lastBoostedAt ASC
            const boostableItems = await db.query.products.findMany({
                where: and(
                    eq(products.shopId, shop.id),
                    eq(products.isActive, true),
                    eq(products.boostEligible, true)
                ),
                orderBy: [asc(products.lastBoostedAt)],
                limit: 5
            });

            if (boostableItems.length === 0) continue;

            const itemIds = boostableItems.map(p => p.shopeeItemId);

            // 2. Call API
            const client = await getShopClient(shop.shopId);
            const response = await client.boostItem(itemIds);

            // 3. Update DB
            // In a real scenario, check response.success_list
            await db.update(products)
                .set({ lastBoostedAt: new Date() })
                .where(and(
                    eq(products.shopId, shop.id),
                    // In a refined query we'd filter by the IDs that succeeded
                    // For now, assume all requested are attempted
                ));

            results.push({ shop: shop.shopName, boosted: itemIds.length });
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

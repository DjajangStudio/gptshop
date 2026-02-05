import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const body = await req.json();
        const { downloadLink, templateMessage, isActive } = body;
        const productId = params.id;

        // Validation
        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        // Update logic
        const updated = await db.update(products)
            .set({
                downloadLink,
                templateMessage,
                isActive,
                updatedAt: new Date()
            })
            .where(eq(products.id, productId))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, product: updated[0] });

    } catch (error: any) {
        console.error("Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

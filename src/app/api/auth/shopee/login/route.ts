import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export async function GET(req: NextRequest) {
    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;
    const redirectUrl = 'http://localhost:3000/api/auth/shopee/callback'; // Must match Shopee Console

    if (!partnerId || !partnerKey) {
        return NextResponse.json({ error: 'Missing Partner Credentials' }, { status: 500 });
    }

    const path = '/api/v2/shop/auth_partner'; // For Shopee V2
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${partnerId}${path}${timestamp}`;
    const sign = createHmac('sha256', partnerKey).update(baseString).digest('hex');

    // Use Sandbox URL for 'Developing' App Status
    const baseUrl = 'https://partner.test-stable.shopeemobile.com';
    const url = new URL(baseUrl + path);
    url.searchParams.append('partner_id', partnerId);
    url.searchParams.append('timestamp', timestamp.toString());
    url.searchParams.append('sign', sign);
    url.searchParams.append('redirect', redirectUrl);

    // Redirect user to Shopee to login and authorize
    return NextResponse.redirect(url.toString());
}

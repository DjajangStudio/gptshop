import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export async function GET(req: NextRequest) {
    const partnerId = (process.env.SHOPEE_PARTNER_ID || '').trim();
    const partnerKey = (process.env.SHOPEE_PARTNER_KEY || '').trim();

    // DEBUG: Use Google to bypass localhost validation issues
    const redirectUrl = 'https://www.google.com';
    // const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    // const redirectUrl = `${baseUrl}/api/auth/shopee/callback`;

    console.log("--- DEBUG SHOPEE AUTH ---");
    console.log("Partner ID:", partnerId);
    console.log("Partner Key (First 5):", partnerKey.substring(0, 5));
    console.log("Timestamp:", Math.floor(Date.now() / 1000));

    if (!partnerId || !partnerKey) {
        return NextResponse.json({ error: 'Missing Partner Credentials' }, { status: 500 });
    }

    const path = '/api/v2/shop/auth_partner'; // For Shopee V2
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${partnerId}${path}${timestamp}`;
    const sign = createHmac('sha256', partnerKey).update(baseString).digest('hex');
    console.log("Base String:", baseString);
    console.log("Signature:", sign);

    // CONFIRMED: IDs are for SANDBOX (Live returned invalid_id).
    // Reverting to Sandbox URL.
    const shopeeBaseUrl = 'https://partner.test-stable.shopeemobile.com';

    // We try to use the PROPER redirect URL now to ensure full flow works if signature passes
    const redirectUrl = `${baseUrl}/api/auth/shopee/callback`;

    const url = new URL(shopeeBaseUrl + path);
    url.searchParams.append('partner_id', partnerId);
    url.searchParams.append('timestamp', timestamp.toString());
    url.searchParams.append('sign', sign);
    url.searchParams.append('redirect', redirectUrl);

    console.log("--- FINAL URL (SANDBOX) ---");
    console.log(url.toString());

    // Redirect user to Shopee to login and authorize
    return NextResponse.redirect(url.toString());
}

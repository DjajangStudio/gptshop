import { createHmac } from 'crypto';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface ShopeeConfig {
    partnerId: number;
    partnerKey: string;
    shopId: number;
    accessToken: string;
}

export class ShopeeClient {
    private partnerId: number;
    private partnerKey: string;
    private shopId: number;
    private accessToken: string;
    private baseUrl = 'https://partner.test-stable.shopeemobile.com'; // Sandbox URL

    // Static method for Auth (Token Exchange)
    static async getAccessToken(partnerId: number, partnerKey: string, code: string, shopId: number) {
        const path = '/api/v2/auth/access_token/get';
        const timestamp = Math.floor(Date.now() / 1000);
        const baseString = `${partnerId}${path}${timestamp}`;
        const sign = createHmac('sha256', partnerKey).update(baseString).digest('hex');

        // Use Sandbox URL
        const url = new URL(path, 'https://partner.test-stable.shopeemobile.com');
        url.searchParams.append('partner_id', partnerId.toString());
        url.searchParams.append('timestamp', timestamp.toString());
        url.searchParams.append('sign', sign);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, partner_id: partnerId, shop_id: shopId })
        });

        const data = await response.json();
        if (data.error) throw new Error(`Auth Error: ${data.message || data.error}`);
        return data; // { access_token, refresh_token, expire_in, ... }
    }

    constructor(config: ShopeeConfig) {
        this.partnerId = config.partnerId;
        this.partnerKey = config.partnerKey;
        this.shopId = config.shopId;
        this.accessToken = config.accessToken;
    }

    // Generate HMAC-SHA256 Signature
    private generateSignature(path: string, body: string, timestamp: number): string {
        const baseString = `${this.partnerId}${path}${timestamp}${this.accessToken}${this.shopId}`;
        return createHmac('sha256', this.partnerKey).update(baseString).digest('hex');
    }

    // Generate Public Signature (for auth/token endpoints)
    private generatePublicSignature(path: string, timestamp: number): string {
        const baseString = `${this.partnerId}${path}${timestamp}`;
        return createHmac('sha256', this.partnerKey).update(baseString).digest('hex');
    }

    private async request(path: string, method: 'GET' | 'POST', body: any = {}) {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = this.generateSignature(path, JSON.stringify(body), timestamp);

        // Check if token needs refresh (TODO: Implement actual check logic here if we had the DB record context)
        // For now, we assume the accessToken passed in needs to be valid. 
        // real-world implementation would check expiry before making this call.

        const url = new URL(path, this.baseUrl);
        url.searchParams.append('partner_id', this.partnerId.toString());
        url.searchParams.append('timestamp', timestamp.toString());
        url.searchParams.append('access_token', this.accessToken);
        url.searchParams.append('shop_id', this.shopId.toString());
        url.searchParams.append('sign', signature);

        const response = await fetch(url.toString(), {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: method === 'POST' ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(`Shopee API Error: ${data.message || data.error}`);
        }

        return data;
    }

    // === CORE ENDPOINTS ===

    async getOrderDetail(orderSnList: string[]) {
        return this.request('/api/v2/order/get_order_detail', 'GET', {
            response_optional_fields: ['item_list', 'buyer_user_id', 'buyer_username', 'recipient_address'],
            order_sn_list: orderSnList.join(',')
        });
    }

    async getItemList(offset: number = 0, pageSize: number = 50, status: string = 'NORMAL') {
        return this.request('/api/v2/product/get_item_list', 'GET', {
            offset,
            page_size: pageSize,
            item_status: status
        });
    }

    async shipOrder(orderSn: string) {
        // For Non-Integrated Shipping (Jasa Kirim Toko), we use the order_sn as the tracking number (resi)
        return this.request('/api/v2/logistics/ship_order', 'POST', {
            order_sn: orderSn,
            package_list: [
                {
                    shipping_method: 'non_integrated',
                    tracking_number: orderSn
                }
            ]
        });
    }

    async sendMessage(toId: number, content: string) {
        return this.request('/api/v2/sellerchat/send_message', 'POST', {
            to_id: toId,
            message_type: 'text',
            content: {
                text: content
            }
        });
    }

    async replyComment(commentId: number, comment: string) {
        return this.request('/api/v2/product/reply_comment', 'POST', {
            comment_id: commentId,
            comment: comment
        });
    }

    async boostItem(itemIdList: number[]) {
        return this.request('/api/v2/product/boost_item', 'POST', {
            item_id_list: itemIdList
        });
    }
}

// === UTILS ===

export function verifyWebhookSignature(details: {
    url: string; // The full URL including protocol and path
    body: string; // Raw body string
    signature: string; // The signature from headers
    partnerKey: string;
}) {
    // Shopee Webhook Signature: HMAC-SHA256(url + | + body, partner_key)
    const baseString = `${details.url}|${details.body}`;
    const generated = createHmac('sha256', details.partnerKey).update(baseString).digest('hex');
    return generated === details.signature;
}

export async function getShopClient(shopId: number) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.shopId, shopId)
    });

    if (!shop) throw new Error('Shop not found');

    // TODO: Check for token expiry and refresh if needed
    // if (shop.tokenExpiresAt < new Date()) { ...refresh logic... }

    return new ShopeeClient({
        partnerId: parseInt(shop.partnerId),
        partnerKey: shop.partnerKey,
        shopId: shop.shopId,
        accessToken: shop.accessToken || '',
    });
}

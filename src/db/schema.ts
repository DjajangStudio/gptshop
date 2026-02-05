import { pgTable, uuid, text, varchar, boolean, timestamp, bigint, integer, jsonb, pgEnum, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ ENUMS ============
export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CHAT_SENT',
  'SHIPPED',
  'COMPLETED',
  'FAILED'
]);

export const templateTypeEnum = pgEnum('template_type', [
  'PRESALES',
  'RATING_1',
  'RATING_2',
  'RATING_3',
  'RATING_4',
  'RATING_5'
]);

export const logActionEnum = pgEnum('log_action', [
  'WEBHOOK_RECEIVED',
  'CHAT_SENT',
  'ORDER_SHIPPED',
  'BOOST_EXECUTED',
  'TOKEN_REFRESHED',
  'ERROR'
]);

// ============ TABLES ============

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  passwordHash: text('password_hash'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  shopId: bigint('shop_id', { mode: 'number' }).notNull().unique(),
  shopName: varchar('shop_name', { length: 255 }),
  partnerId: varchar('partner_id', { length: 100 }).notNull(),
  partnerKey: text('partner_key').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  isActive: boolean('is_active').default(true),
  settings: jsonb('settings').$type<{
    autoFulfillment: boolean;
    autoReply: boolean;
    autoRating: boolean;
    autoBoost: boolean;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').references(() => shops.id).notNull(),
  shopeeItemId: bigint('shopee_item_id', { mode: 'number' }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull(),
  name: varchar('name', { length: 500 }),
  downloadLink: text('download_link').notNull(),
  templateMessage: text('template_message').default(
    'Terima kasih sudah order! 🎉\n\nBerikut link download produk kamu:\n{link}\n\nJangan lupa beri ⭐⭐⭐⭐⭐ ya kak!'
  ),
  isActive: boolean('is_active').default(true),
  boostEligible: boolean('boost_eligible').default(true),
  lastBoostedAt: timestamp('last_boosted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.shopId, t.sku),
}));

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').references(() => shops.id).notNull(),
  orderSn: varchar('order_sn', { length: 50 }).notNull().unique(),
  buyerId: bigint('buyer_id', { mode: 'number' }),
  buyerUsername: varchar('buyer_username', { length: 255 }),
  status: orderStatusEnum('status').default('PENDING'),
  itemsSnapshot: jsonb('items_snapshot').$type<Array<{
    itemId: number;
    sku: string;
    name: string;
    quantity: number;
  }>>(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  productId: uuid('product_id').references(() => products.id),
  sku: varchar('sku', { length: 100 }).notNull(),
  quantity: integer('quantity').default(1),
  downloadLinkSent: text('download_link_sent'),
});

export const replyTemplates = pgTable('reply_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').references(() => shops.id).notNull(),
  type: templateTypeEnum('type').notNull(),
  templateText: text('template_text').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const logs = pgTable('logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').references(() => shops.id),
  action: logActionEnum('action').notNull(),
  orderSn: varchar('order_sn', { length: 50 }),
  requestPayload: jsonb('request_payload'),
  responsePayload: jsonb('response_payload'),
  responseStatus: integer('response_status'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many }) => ({
  shops: many(shops),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  user: one(users, { fields: [shops.userId], references: [users.id] }),
  products: many(products),
  orders: many(orders),
  templates: many(replyTemplates),
  logs: many(logs),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  shop: one(shops, { fields: [products.shopId], references: [shops.id] }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  shop: one(shops, { fields: [orders.shopId], references: [shops.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

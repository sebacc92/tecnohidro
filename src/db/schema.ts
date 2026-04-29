import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),
  parent_id: text('parent_id').references((): AnySQLiteColumn => categories.id),
  show_in_menu: integer('show_in_menu', { mode: 'boolean' }).default(true),
  sort_order: integer('sort_order').default(0),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  price: integer('price'), // store as cents or use real for float, typically integer is better for currency
  stock: integer('stock').default(0),
  source: text('source', { enum: ['cms', 'meli'] }).notNull().default('cms'),
  meli_id: text('meli_id'),
  external_link: text('external_link'),
  images: text('images', { mode: 'json' }).$type<string[]>(), // JSON array of image URLs
  category_id: text('category_id').references(() => categories.id),
  status: text('status', { enum: ['active', 'draft'] }).notNull().default('active'),
  is_featured: integer('is_featured', { mode: 'boolean' }).default(false),
  is_offer: integer('is_offer', { mode: 'boolean' }).default(false),
  offer_expires_at: integer('offer_expires_at', { mode: 'timestamp' }),
  discount_price: integer('discount_price'),
  discount_percent: integer('discount_percent'),
});

export const siteContent = sqliteTable('site_content', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  section: text('section'),
});

export const meliIntegrations = sqliteTable('meli_integrations', {
  user_id: text('user_id').primaryKey(),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token').notNull(),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const brands = sqliteTable('brands', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category', { enum: ['infraestructura', 'domiciliaria', 'herramientas'] }).notNull(),
  imageUrl: text('image_url').notNull(),
});

export const instagramPosts = sqliteTable('instagram_posts', {
  id: text('id').primaryKey(),
  permalink: text('permalink'),
  mediaUrl: text('media_url'),
  mediaType: text('media_type'),
  caption: text('caption'),
  timestamp: text('timestamp'),
});

export const chatSessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastActive: integer('last_active', { mode: 'timestamp' }).notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => chatSessions.id).notNull(),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

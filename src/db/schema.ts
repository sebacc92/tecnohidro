import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),
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
});

export const siteContent = sqliteTable('site_content', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  section: text('section'),
});

export const authTokens = sqliteTable('auth_tokens', {
  id: text('id').primaryKey(),
  service_name: text('service_name', { enum: ['meli'] }).notNull().unique(),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token'),
  expires_at: integer('expires_at', { mode: 'timestamp' }),
});

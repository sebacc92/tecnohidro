import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const url = process.env.TURSO_DATABASE_URL || 'file:./local.db';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: (url.startsWith('file:') ? 'sqlite' : 'turso') as 'sqlite' | 'turso',
  dbCredentials: {
    url,
    ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}),
  },
});

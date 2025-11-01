import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

let dbInstance: NeonHttpDatabase | null = null;

function getDatabaseUrl(): string {
  // In Cloudflare Workers with nodejs_compat, process.env should work
  // But we also check for globalThis.env as a fallback
  // @ts-ignore - globalThis.env might be available in some Worker contexts
  const url = (typeof globalThis !== 'undefined' && globalThis.env?.DATABASE_URL) 
    || (typeof process !== 'undefined' && process.env?.DATABASE_URL)
    || null;
  
  if (!url) {
    throw new Error(
      "DATABASE_URL is required but not provided. " +
      "Make sure it's configured in wrangler.toml (as env.DATABASE_URL) or as an environment variable."
    );
  }
  
  return url;
}

function initializeDb(): NeonHttpDatabase {
  if (dbInstance) {
    return dbInstance;
  }
  
  const url = getDatabaseUrl();
  const sql = neon(url);
  dbInstance = drizzle(sql);
  return dbInstance;
}

// Lazy initialization - will be called when db methods are first accessed
let _db: NeonHttpDatabase;

// Export db with lazy initialization
export const db: NeonHttpDatabase = new Proxy({} as NeonHttpDatabase, {
  get(_target, prop) {
    if (!_db) {
      _db = initializeDb();
    }
    const value = (_db as any)[prop];
    return typeof value === 'function' ? value.bind(_db) : value;
  }
});

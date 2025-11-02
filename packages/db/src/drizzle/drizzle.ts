import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type Env = {
  DATABASE_URL?: string;
};

let dbInstance: NeonHttpDatabase | null = null;
let dbEnv: Env | null = null;

function getDatabaseUrl(env?: Env): string {
  // Priority order:
  // 1. Passed env parameter (from Hono context c.env)
  // 2. globalThis.env (Cloudflare Workers)
  // 3. process.env (Node.js/Cloudflare Workers with nodejs_compat)
  
  const url = env?.DATABASE_URL
    || (typeof globalThis !== 'undefined' && (globalThis as any).env?.DATABASE_URL)
    || (typeof process !== 'undefined' && process.env?.DATABASE_URL)
    || null;
  
  if (!url) {
    throw new Error(
      "DATABASE_URL is required but not provided. " +
      "Make sure it's configured in wrangler.toml (as [vars] or [env.dev.vars]) or passed via env parameter."
    );
  }
  
  return url;
}

function initializeDb(env?: Env): NeonHttpDatabase {
  // If env is provided and different from cached env, create new instance
  if (env && env !== dbEnv) {
    dbEnv = env;
    const url = getDatabaseUrl(env);
    const sql = neon(url);
    dbInstance = drizzle(sql);
    return dbInstance;
  }
  
  // If no env provided, use cached instance or initialize with default
  if (dbInstance) {
    return dbInstance;
  }
  
  const url = getDatabaseUrl(env);
  const sql = neon(url);
  dbInstance = drizzle(sql);
  if (env) {
    dbEnv = env;
  }
  return dbInstance;
}

// Function to get db with env (for use in Hono routes)
export function getDb(env?: Env): NeonHttpDatabase {
  return initializeDb(env);
}

// Lazy initialization - will be called when db methods are first accessed
let _db: NeonHttpDatabase;

// Export db with lazy initialization (for backward compatibility)
export const db: NeonHttpDatabase = new Proxy({} as NeonHttpDatabase, {
  get(_target, prop) {
    if (!_db) {
      _db = initializeDb();
    }
    const value = (_db as any)[prop];
    return typeof value === 'function' ? value.bind(_db) : value;
  }
});

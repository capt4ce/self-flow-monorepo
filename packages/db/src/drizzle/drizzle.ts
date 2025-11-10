import { drizzle } from "drizzle-orm/neon-serverless";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { getEnvContext, type Env } from "../env-context";

const isNodeRuntime =
  typeof process !== "undefined" && !!process.versions?.node;

let cachedDbInstance: NeonDatabase | null = null;
let cachedEnv: Env | null = null;
let cachedPool: Pool | null = null;

function ensureWebSocketConstructor(): void {
  if (typeof WebSocket !== "undefined" || neonConfig.webSocketConstructor) {
    return;
  }

  if (typeof require === "undefined") {
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const wsModule: any = require("ws");
    neonConfig.webSocketConstructor =
      wsModule.WebSocket || wsModule.default || wsModule;
  } catch {
    // Ignore; we'll rely on environments that already provide WebSocket
  }
}

function getDatabaseUrl(env?: Env): string {
  // Priority order:
  // 1. Passed env parameter (backward compatibility)
  // 2. Env from async context (set by middleware)
  // 3. globalThis.env (Cloudflare Workers)
  // 4. process.env (Node.js/Cloudflare Workers with nodejs_compat)

  const contextEnv = env || getEnvContext();

  const url =
    contextEnv?.DATABASE_URL ||
    (typeof globalThis !== "undefined" &&
      (globalThis as any).env?.DATABASE_URL) ||
    (typeof process !== "undefined" && process.env?.DATABASE_URL) ||
    null;

  if (!url) {
    throw new Error(
      "DATABASE_URL is required but not provided. " +
        "Make sure it's configured in wrangler.toml (as [vars] or [env.dev.vars]) or passed via env parameter."
    );
  }

  return url;
}

function createDbInstance(url: string): { db: NeonDatabase; pool: Pool } {
  ensureWebSocketConstructor();
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);
  return { db, pool };
}

function initializeDb(env?: Env): NeonDatabase {
  const effectiveEnv = env || getEnvContext();
  const url = getDatabaseUrl(effectiveEnv);

  if (isNodeRuntime) {
    if (effectiveEnv && effectiveEnv !== cachedEnv) {
      cachedEnv = effectiveEnv;
      if (cachedPool) {
        void cachedPool.end().catch(() => {});
      }
      const { db, pool } = createDbInstance(url);
      cachedDbInstance = db;
      cachedPool = pool;
      return db;
    }

    if (cachedDbInstance) {
      return cachedDbInstance;
    }

    const { db, pool } = createDbInstance(url);
    cachedDbInstance = db;
    cachedPool = pool;
    if (effectiveEnv) {
      cachedEnv = effectiveEnv;
    }
    return db;
  }

  // For non-Node runtimes (e.g., Cloudflare Workers), avoid caching I/O across requests
  const { db } = createDbInstance(url);
  return db;
}

function getCachedDb(): NeonDatabase {
  if (!cachedDbInstance) {
    const url = getDatabaseUrl();
    const { db, pool } = createDbInstance(url);
    cachedDbInstance = db;
    cachedPool = pool;
  }
  return cachedDbInstance;
}

// Function to get db - now reads env from context automatically
export function getDb(env?: Env): NeonDatabase {
  return initializeDb(env);
}

// Export db with lazy initialization (for backward compatibility)
export const db: NeonDatabase = new Proxy({} as NeonDatabase, {
  get(_target, prop) {
    const instance = isNodeRuntime ? getCachedDb() : initializeDb();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

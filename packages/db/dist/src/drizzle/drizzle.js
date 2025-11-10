"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.getDb = getDb;
const neon_serverless_1 = require("drizzle-orm/neon-serverless");
const serverless_1 = require("@neondatabase/serverless");
const env_context_1 = require("../env-context");
const isNodeRuntime = typeof process !== "undefined" && !!process.versions?.node;
let cachedDbInstance = null;
let cachedEnv = null;
let cachedPool = null;
function ensureWebSocketConstructor() {
    if (typeof WebSocket !== "undefined" || serverless_1.neonConfig.webSocketConstructor) {
        return;
    }
    if (typeof require === "undefined") {
        return;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const wsModule = require("ws");
        serverless_1.neonConfig.webSocketConstructor =
            wsModule.WebSocket || wsModule.default || wsModule;
    }
    catch {
        // Ignore; we'll rely on environments that already provide WebSocket
    }
}
function getDatabaseUrl(env) {
    // Priority order:
    // 1. Passed env parameter (backward compatibility)
    // 2. Env from async context (set by middleware)
    // 3. globalThis.env (Cloudflare Workers)
    // 4. process.env (Node.js/Cloudflare Workers with nodejs_compat)
    const contextEnv = env || (0, env_context_1.getEnvContext)();
    const url = contextEnv?.DATABASE_URL ||
        (typeof globalThis !== "undefined" &&
            globalThis.env?.DATABASE_URL) ||
        (typeof process !== "undefined" && process.env?.DATABASE_URL) ||
        null;
    if (!url) {
        throw new Error("DATABASE_URL is required but not provided. " +
            "Make sure it's configured in wrangler.toml (as [vars] or [env.dev.vars]) or passed via env parameter.");
    }
    return url;
}
function createDbInstance(url) {
    ensureWebSocketConstructor();
    const pool = new serverless_1.Pool({ connectionString: url });
    const db = (0, neon_serverless_1.drizzle)(pool);
    return { db, pool };
}
function initializeDb(env) {
    const effectiveEnv = env || (0, env_context_1.getEnvContext)();
    const url = getDatabaseUrl(effectiveEnv);
    if (isNodeRuntime) {
        if (effectiveEnv && effectiveEnv !== cachedEnv) {
            cachedEnv = effectiveEnv;
            if (cachedPool) {
                void cachedPool.end().catch(() => { });
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
function getCachedDb() {
    if (!cachedDbInstance) {
        const url = getDatabaseUrl();
        const { db, pool } = createDbInstance(url);
        cachedDbInstance = db;
        cachedPool = pool;
    }
    return cachedDbInstance;
}
// Function to get db - now reads env from context automatically
function getDb(env) {
    return initializeDb(env);
}
// Export db with lazy initialization (for backward compatibility)
exports.db = new Proxy({}, {
    get(_target, prop) {
        const instance = isNodeRuntime ? getCachedDb() : initializeDb();
        const value = instance[prop];
        return typeof value === "function" ? value.bind(instance) : value;
    },
});

/**
 * Environment context management for request-scoped environment variables.
 * Supports both Node.js (via AsyncLocalStorage) and Cloudflare Workers.
 */

type Env = {
  DATABASE_URL?: string;
  STACK_PROJECT_ID?: string;
  STACK_PROJECT_SECRET?: string;
  STACK_JWKS_URL?: string;
  FRONTEND_URL?: string;
};

type AsyncLocalStorageType<T> =
  import("async_hooks").AsyncLocalStorage<T>;

// Try to use AsyncLocalStorage if available (Node.js 12.17+)
let asyncLocalStorage: AsyncLocalStorageType<{ env?: Env }> | null = null;
try {
  if (typeof require !== "undefined") {
    const asyncHooks = require("async_hooks") as typeof import("async_hooks");
    asyncLocalStorage = new asyncHooks.AsyncLocalStorage<{ env?: Env }>();
  }
} catch {
  // AsyncLocalStorage not available (e.g., Cloudflare Workers)
  asyncLocalStorage = null;
}

/**
 * Store environment in the current async context
 */
export function setEnvContext(env: Env): void {
  if (asyncLocalStorage) {
    asyncLocalStorage.enterWith({ env });
  } else {
    // Fallback for environments without AsyncLocalStorage
    // For Cloudflare Workers, each request is isolated, so we can use a global
    // that's set at the start of each request
    (globalThis as any).__requestEnv = env;
  }
}

/**
 * Get environment from the current async context
 */
export function getEnvContext(): Env | undefined {
  if (asyncLocalStorage) {
    const context = asyncLocalStorage.getStore();
    return context?.env;
  } else {
    // Fallback for environments without AsyncLocalStorage
    return (globalThis as any).__requestEnv;
  }
}

/**
 * Run a function with environment context
 */
export function runWithEnvContext<T>(env: Env, fn: () => T): T {
  if (asyncLocalStorage) {
    return asyncLocalStorage.run({ env }, fn);
  } else {
    // Fallback: set global and execute
    const prevEnv = (globalThis as any).__requestEnv;
    (globalThis as any).__requestEnv = env;
    try {
      return fn();
    } finally {
      (globalThis as any).__requestEnv = prevEnv;
    }
  }
}

export type { Env };


"use strict";
/**
 * Environment context management for request-scoped environment variables.
 * Supports both Node.js (via AsyncLocalStorage) and Cloudflare Workers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setEnvContext = setEnvContext;
exports.getEnvContext = getEnvContext;
exports.runWithEnvContext = runWithEnvContext;
// Try to use AsyncLocalStorage if available (Node.js 12.17+)
let asyncLocalStorage = null;
try {
    if (typeof require !== "undefined") {
        const asyncHooks = require("async_hooks");
        asyncLocalStorage = new asyncHooks.AsyncLocalStorage();
    }
}
catch {
    // AsyncLocalStorage not available (e.g., Cloudflare Workers)
    asyncLocalStorage = null;
}
/**
 * Store environment in the current async context
 */
function setEnvContext(env) {
    if (asyncLocalStorage) {
        asyncLocalStorage.enterWith({ env });
    }
    else {
        // Fallback for environments without AsyncLocalStorage
        // For Cloudflare Workers, each request is isolated, so we can use a global
        // that's set at the start of each request
        globalThis.__requestEnv = env;
    }
}
/**
 * Get environment from the current async context
 */
function getEnvContext() {
    if (asyncLocalStorage) {
        const context = asyncLocalStorage.getStore();
        return context?.env;
    }
    else {
        // Fallback for environments without AsyncLocalStorage
        return globalThis.__requestEnv;
    }
}
/**
 * Run a function with environment context
 */
function runWithEnvContext(env, fn) {
    if (asyncLocalStorage) {
        return asyncLocalStorage.run({ env }, fn);
    }
    else {
        // Fallback: set global and execute
        const prevEnv = globalThis.__requestEnv;
        globalThis.__requestEnv = env;
        try {
            return fn();
        }
        finally {
            globalThis.__requestEnv = prevEnv;
        }
    }
}

import { Clerk } from "@clerk/backend";
import type { Clerk as ClerkType } from "@clerk/backend";

let clerkInstance: ClerkType | null = null;

function getClerkApiKey(env?: any): string {
  // Try env parameter first (from Cloudflare Workers context)
  if (env?.CLERK_API_KEY) {
    return env.CLERK_API_KEY;
  }
  
  // In Cloudflare Workers, try globalThis.env
  // @ts-ignore - globalThis.env might be available in Worker contexts
  const key = (typeof globalThis !== 'undefined' && globalThis.env?.CLERK_API_KEY)
    || (typeof process !== 'undefined' && process.env?.CLERK_API_KEY)
    || null;
  
  if (!key) {
    throw new Error("CLERK_API_KEY is required but not provided. Make sure it's configured in wrangler.toml (as env.CLERK_API_KEY) or environment variables.");
  }
  
  return key;
}

export function getClerk(env?: any): ClerkType {
  // Lazy initialization - only create Clerk instance when needed
  // If env is provided, use it. Otherwise try to get from global scope
  const actualEnv = env || 
    (typeof globalThis !== 'undefined' && (globalThis as any).env) ||
    (typeof process !== 'undefined' && process.env) ||
    undefined;
    
  // Create a new instance if env changed (for different requests)
  // For now, reuse the same instance if it exists
  if (!clerkInstance) {
    const apiKey = getClerkApiKey(actualEnv);
    clerkInstance = Clerk({ apiKey });
  }
  return clerkInstance;
}

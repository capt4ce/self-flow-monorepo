import { getClerk } from "./src/adapters/clerk";
import type { Context, Next } from "hono";

/**
 * Middleware to authenticate requests using Clerk JWT tokens
 * Extracts and verifies the Bearer token from Authorization header
 * Sets userId in context if authentication succeeds
 */
export async function authenticate(c: Context, next: Next) {
  try {
    // Get Authorization header
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized: Missing or invalid Authorization header" }, 401);
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Get env from context (Cloudflare Workers makes it available via c.env)
    // @ts-ignore - c.env is available in Cloudflare Workers when Bindings type is set
    const env = c.env || (typeof process !== 'undefined' ? process.env : {});
    
    // Get Clerk instance with environment variables
    const clerk = getClerk(env);

    // Verify token with Clerk
    const sessionClaims = await clerk.verifyToken(token);
    
    if (!sessionClaims || !sessionClaims.sub) {
      return c.json({ error: "Unauthorized: Invalid token" }, 401);
    }

    // Set userId in context (sub is the user ID in Clerk)
    c.set("userId", sessionClaims.sub);
    
    // Continue to next handler
    await next();
  } catch (error: any) {
    console.error("Authentication error:", error);
    return c.json(
      { error: "Unauthorized: Token verification failed", details: error.message },
      401
    );
  }
}

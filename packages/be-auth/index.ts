import { verifyNeonAuthToken } from "./src/adapters/neon-auth";
import type { Context, Next } from "hono";

/**
 * Middleware to authenticate requests using Neon Auth (Stack Auth) JWT tokens
 * Extracts and verifies the Bearer token from Authorization header
 * Sets userId in context if authentication succeeds
 */
export async function authenticate(c: Context, next: Next) {
  try {
    // Get Authorization header
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
      console.error("Missing Authorization header");
      return c.json(
        { error: "Unauthorized: Missing Authorization header" },
        401
      );
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.error(
        "Invalid Authorization header format:",
        authHeader.substring(0, 20) + "..."
      );
      return c.json(
        {
          error:
            "Unauthorized: Invalid Authorization header format. Expected 'Bearer <token>'",
        },
        401
      );
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token || token.trim().length === 0) {
      console.error("Empty token after Bearer prefix");
      return c.json({ error: "Unauthorized: Empty token" }, 401);
    }

    // Get env from context (Cloudflare Workers makes it available via c.env)
    // @ts-ignore - c.env is available in Cloudflare Workers when Bindings type is set
    const env = c.env || (typeof process !== "undefined" ? process.env : {});

    // Verify token with Neon Auth (Stack Auth)
    try {
      // Verify the JWT token from the frontend
      const sessionClaims = await verifyNeonAuthToken(token, env);

      console.log("Token verified successfully, user ID:", sessionClaims.sub);

      if (!sessionClaims || !sessionClaims.sub) {
        console.error(
          "Token verification returned no session claims or user ID"
        );
        return c.json(
          { error: "Unauthorized: Invalid token - no user ID found" },
          401
        );
      }

      // Set userId in context (sub is the user ID in Neon Auth)
      c.set("userId", sessionClaims.sub);

      // Continue to next handler
      await next();
    } catch (verifyError: any) {
      console.error("Token verification error:", {
        message: verifyError.message,
        name: verifyError.name,
        stack: verifyError.stack,
        tokenPreview: token.substring(0, 30) + "...",
        tokenLength: token.length,
      });

      // Check for specific error types
      if (verifyError.message?.includes("expired")) {
        return c.json(
          {
            error: "Unauthorized: Token has expired",
            details: verifyError.message,
          },
          401
        );
      }

      return c.json(
        {
          error: "Unauthorized: Token verification failed",
          details: verifyError.message,
          errorType: verifyError.name,
        },
        401
      );
    }
  } catch (error: any) {
    console.error("Authentication middleware error:", error);
    return c.json(
      { error: "Unauthorized: Authentication failed", details: error.message },
      401
    );
  }
}

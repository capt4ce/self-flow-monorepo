import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { routes } from "./src/routes";

type Env = {
  STACK_PROJECT_ID?: string;
  STACK_PROJECT_SECRET?: string;
  STACK_JWKS_URL?: string;
  DATABASE_URL?: string;
  FRONTEND_URL?: string;
};

const app = new Hono<{ Bindings: Env }>();

// Configure CORS
// Get allowed origins from environment or use defaults for development
function getAllowedOrigins(c: Context<{ Bindings: Env }>): string[] {
  const origins: string[] = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];

  // Add environment variable from Cloudflare Workers bindings if set (for production)
  // @ts-ignore - c.env is available in Cloudflare Workers when Bindings type is set
  const frontendUrl = c.env?.FRONTEND_URL;
  if (frontendUrl) {
    const cleanUrl = frontendUrl.trim();
    if (cleanUrl && !origins.includes(cleanUrl)) {
      origins.push(cleanUrl);
    }
  }

  // Fallback to process.env for local development
  if (typeof process !== "undefined" && process.env?.FRONTEND_URL) {
    const url = process.env.FRONTEND_URL.trim();
    if (url && !origins.includes(url)) {
      origins.push(url);
    }
  }

  return origins;
}

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = getAllowedOrigins(c);
      
      // Normalize the origin for comparison (remove trailing slash, lowercase)
      const normalize = (url: string) => {
        let normalized = url.toLowerCase().trim();
        if (normalized.endsWith("/")) {
          normalized = normalized.slice(0, -1);
        }
        return normalized;
      };
      
      // Allow requests with no origin (e.g., mobile apps, Postman, server-to-server)
      // When credentials is true, we can't use "*", so we allow the first origin
      if (!origin) {
        return allowed.length > 0 ? allowed[0] : "http://localhost:3000";
      }
      
      const normalizedOrigin = normalize(origin);
      
      // Check exact match
      for (const allowedOrigin of allowed) {
        if (normalize(allowedOrigin) === normalizedOrigin) {
          return origin; // Return the actual origin (not normalized) to preserve case
        }
      }
      
      // In development, allow any localhost origin (for flexibility)
      // This helps when frontend runs on different ports
      const isDevelopment = 
        typeof process !== "undefined" && 
        (process.env.NODE_ENV === "development" || !process.env.NODE_ENV);
      
      if (isDevelopment) {
        // Allow localhost with any port in development
        if (
          normalizedOrigin.startsWith("http://localhost:") ||
          normalizedOrigin.startsWith("http://127.0.0.1:")
        ) {
          return origin;
        }
      }
      
      // Not allowed - return false
      return false;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposeHeaders: ["Content-Length", "Content-Type"],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

app.route("/api", routes);

app.get("/", (c) => c.json({ message: "Hello from Hono!" }));

export default app;

import { Hono } from "hono";
import { cors } from "hono/cors";
import { routes } from "./src/routes";

type Env = {
  CLERK_API_KEY?: string;
  DATABASE_URL?: string;
  FRONTEND_URL?: string;
};

const app = new Hono<{ Bindings: Env }>();

// Configure CORS
// Get allowed origins from environment or use defaults for development
function getAllowedOrigins(): string[] {
  const origins: string[] = ["http://localhost:3000", "http://localhost:3001"];

  // Add environment variable if set (for production)
  if (typeof process !== "undefined" && process.env?.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  return origins;
}

app.use(
  "*",
  cors({
    origin: getAllowedOrigins(),
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.route("/api", routes);

app.get("/", (c) => c.json({ message: "Hello from Hono!" }));

export default app;

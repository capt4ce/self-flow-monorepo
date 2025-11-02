import { Hono, type Context, type Next } from "hono";
import { authenticate } from "@self-flow/be-auth";
import { setEnvContext } from "@self-flow/db";
import { user } from "./user";
import { goal } from "./goal";
import { task } from "./task";
import { energy } from "./energy";
import { taskGroup } from "./taskGroup";

export const routes = new Hono();

// Middleware to store env in context for the request
async function envContextMiddleware(c: Context, next: Next) {
  // @ts-ignore - c.env is available in Cloudflare Workers when Bindings type is set
  const env = c.env || (typeof process !== "undefined" ? process.env : {});
  setEnvContext(env);
  await next();
}

// Apply env context middleware first, then authentication
routes.use("*", envContextMiddleware);
routes.use("*", authenticate);

routes.route("/users", user);
routes.route("/goals", goal);
routes.route("/tasks", task);
routes.route("/energy", energy);
routes.route("/task-groups", taskGroup);

import { Hono } from "hono";
import { authenticate } from "@self-flow/be-auth";
import { user } from "./user";
import { goal } from "./goal";
import { task } from "./task";
import { energy } from "./energy";
import { taskGroup } from "./taskGroup";

export const routes = new Hono();

// Apply authentication middleware to all routes
routes.use("*", authenticate);

routes.route("/users", user);
routes.route("/goals", goal);
routes.route("/tasks", task);
routes.route("/energy", energy);
routes.route("/task-groups", taskGroup);

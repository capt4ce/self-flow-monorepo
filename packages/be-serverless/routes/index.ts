import { Hono } from "hono";
import { user } from "./user";

const app = new Hono();

app.route("/users", user);

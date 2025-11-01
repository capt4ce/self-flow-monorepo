import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { UserDTO } from "@self-flow/common/types";

// Tag used in docs
const tags = ["Users"];
export const user = new OpenAPIHono();

function getUserId(c: any): string {
  const userId = c.get("userId");
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

user.openapi(
  {
    method: "get",
    path: "/",
    tags,
    request: {},
    responses: {
      200: {
        description: "List users",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(UserDTO) }),
          },
        },
      },
    },
  },
  async (c) => {
    // TODO: real DB call
    const data = [
      {
        id: crypto.randomUUID(),
        email: "a@b.com",
        name: "Ali",
        createdAt: new Date().toISOString(),
      },
    ];
    return c.json({ data });
  }
);

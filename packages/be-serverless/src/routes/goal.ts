import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { GoalDTO, CreateGoalDTO, UpdateGoalDTO, GoalStatus } from "@self-flow/common/types";
import { listGoals } from "@self-flow/be-services/src/goal/listGoals";
import { createGoal } from "@self-flow/be-services/src/goal/createGoal";
import { updateGoal } from "@self-flow/be-services/src/goal/updateGoal";
import { deleteGoal } from "@self-flow/be-services/src/goal/deleteGoal";

const tags = ["Goals"];
export const goal = new OpenAPIHono();

// Get userId from request - this should be set by auth middleware
function getUserId(c: any): string {
  const userId = c.get("userId");
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

goal.openapi(
  {
    method: "get",
    path: "/",
    tags,
    request: {
      query: z.object({
        status: GoalStatus,
      }),
    },
    responses: {
      200: {
        description: "List goals",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(GoalDTO) }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const { status } = c.req.valid("query");
    const data = await listGoals(userId, status);
    return c.json({ data });
  }
);

goal.openapi(
  {
    method: "post",
    path: "/",
    tags,
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateGoalDTO,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Create goal",
        content: {
          "application/json": {
            schema: z.object({ data: GoalDTO }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const body = c.req.valid("json");
    const data = await createGoal(userId, body);
    return c.json({ data });
  }
);

goal.openapi(
  {
    method: "put",
    path: "/:id",
    tags,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          "application/json": {
            schema: UpdateGoalDTO,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Update goal",
        content: {
          "application/json": {
            schema: z.object({ data: GoalDTO }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const data = await updateGoal(userId, id, body);
    return c.json({ data });
  }
);

goal.openapi(
  {
    method: "delete",
    path: "/:id",
    tags,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Delete goal",
        content: {
          "application/json": {
            schema: z.object({ message: z.string() }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid("param");
    await deleteGoal(userId, id);
    return c.json({ message: "Goal deleted" });
  }
);


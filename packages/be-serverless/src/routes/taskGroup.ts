import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  TaskGroupDTO,
  CreateTaskGroupDTO,
  UpdateTaskGroupDTO,
} from "@self-flow/common/types";
import { createTaskGroup } from "@self-flow/be-services/src/taskGroup/createTaskGroup";
import { updateTaskGroup } from "@self-flow/be-services/src/taskGroup/updateTaskGroup";
import { deleteTaskGroup } from "@self-flow/be-services/src/taskGroup/deleteTaskGroup";

const tags = ["TaskGroups"];
export const taskGroup = new OpenAPIHono();

function getUserId(c: any): string {
  const userId = c.get("userId");
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

taskGroup.openapi(
  {
    method: "post",
    path: "/",
    tags,
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateTaskGroupDTO,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Create task group",
        content: {
          "application/json": {
            schema: z.object({ data: TaskGroupDTO }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const body = c.req.valid("json");
    const data = await createTaskGroup(userId, body);
    return c.json({ data });
  }
);

taskGroup.openapi(
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
            schema: UpdateTaskGroupDTO,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Update task group",
        content: {
          "application/json": {
            schema: z.object({ data: TaskGroupDTO }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const data = await updateTaskGroup(userId, id, body);
    return c.json({ data });
  }
);

taskGroup.openapi(
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
        description: "Delete task group",
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
    await deleteTaskGroup(userId, id);
    return c.json({ message: "Task group deleted" });
  }
);



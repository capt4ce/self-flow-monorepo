import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import {
  TaskDTO,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilterDefinition,
  TaskSortOption,
} from "@self-flow/common/types";
import { listTasks } from "@self-flow/be-services/src/task/listTasks";
import { createTask } from "@self-flow/be-services/src/task/createTask";
import { createTaskForDate } from "@self-flow/be-services/src/task/createTaskForDate";
import { updateTask } from "@self-flow/be-services/src/task/updateTask";
import { deleteTask } from "@self-flow/be-services/src/task/deleteTask";
import { updateTaskOrder } from "@self-flow/be-services/src/task/updateTaskOrder";
import { listSubtasks } from "@self-flow/be-services/src/task/listSubtasks";
import { listTaskSubtaskCount } from "@self-flow/be-services/src/task/listTaskSubtaskCount";

const tags = ["Tasks"];
export const task = new OpenAPIHono();

function parseJsonParam<T>(
  value: string | undefined,
  schema: z.ZodType<T>,
  errorMessage: string
): T | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    return schema.parse(parsed);
  } catch {
    throw new HTTPException(400, { message: errorMessage });
  }
}

const TaskListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  search: z.string().max(256).optional(),
  filters: z.string().optional().openapi({
    description: "JSON encoded array of filter definitions",
  }),
  sort: z.string().optional().openapi({
    description: "JSON encoded array of sort options",
  }),
});

function getUserId(c: any): string {
  const userId = c.get("userId");
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

task.openapi(
  {
    method: "get",
    path: "/",
    tags,
    request: {
      query: TaskListQuerySchema,
    },
    responses: {
      200: {
        description: "List tasks",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(TaskDTO) }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const {
      limit = 20,
      offset = 0,
      search,
      filters: filtersJson,
      sort: sortJson,
    } = c.req.valid("query");
    const filters = parseJsonParam(
      filtersJson,
      z.array(TaskFilterDefinition),
      "Invalid filters parameter"
    );
    const sort = parseJsonParam(
      sortJson,
      z.array(TaskSortOption),
      "Invalid sort parameter"
    );
    const data = await listTasks(userId, {
      limit,
      offset,
      search,
      filters,
      sort,
    });
    return c.json({ data });
  }
);

task.openapi(
  {
    method: "post",
    path: "/",
    tags,
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateTaskDTO.extend({
              newSubtasks: z
                .array(CreateTaskDTO.omit({ parentId: true }))
                .optional(),
              existingSubtaskIds: z.array(z.string().uuid()).optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Create task",
        content: {
          "application/json": {
            schema: z.object({ data: TaskDTO }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const body = c.req.valid("json");
    const data = await createTask(userId, body);
    return c.json({ data });
  }
);

task.openapi(
  {
    method: "post",
    path: "/date/:date",
    tags,
    request: {
      params: z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
      }),
      body: {
        content: {
          "application/json": {
            schema: CreateTaskDTO.extend({
              newSubtasks: z
                .array(CreateTaskDTO.omit({ parentId: true }))
                .optional(),
              existingSubtaskIds: z.array(z.string().uuid()).optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description:
          "Create task for a specific date. Creates a daily goal for that date if it doesn't exist.",
        content: {
          "application/json": {
            schema: z.object({ data: TaskDTO }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const { date } = c.req.valid("param");
    const body = c.req.valid("json");
    const data = await createTaskForDate(userId, date, body);
    return c.json({ data });
  }
);

task.openapi(
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
            schema: UpdateTaskDTO.extend({
              newSubtasks: z
                .array(CreateTaskDTO.omit({ parentId: true }))
                .optional(),
              selectedSubtaskIds: z.array(z.string().uuid()).optional(),
              currentSubtaskIds: z.array(z.string().uuid()).optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Update task",
        content: {
          "application/json": {
            schema: z.object({ data: TaskDTO }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const data = await updateTask(userId, id, body);
    return c.json({ data });
  }
);

task.openapi(
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
        description: "Delete task",
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
    await deleteTask(userId, id);
    return c.json({ message: "Task deleted" });
  }
);

task.openapi(
  {
    method: "post",
    path: "/reorder",
    tags,
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              orders: z.array(
                z.object({
                  taskId: z.string().uuid(),
                  orderIndex: z.number(),
                })
              ),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Update task order",
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
    const { orders } = c.req.valid("json");
    await updateTaskOrder(userId, orders);
    return c.json({ message: "Task order updated" });
  }
);

task.openapi(
  {
    method: "post",
    path: "/subtasks",
    tags,
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              parentIds: z.array(z.string().uuid()),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "List subtasks",
        content: {
          "application/json": {
            schema: z.record(z.string().uuid(), z.array(TaskDTO)),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const { parentIds } = c.req.valid("json");
    const data = await listSubtasks(userId, parentIds);
    return c.json(data);
  }
);

task.openapi(
  {
    method: "post",
    path: "/subtask-counts",
    tags,
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              parentIds: z.array(z.string().uuid()),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Get subtask counts",
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                parent_id: z.string().uuid(),
                subtaskCount: z.number(),
              })
            ),
          },
        },
      },
    },
  },
  async (c) => {
    const { parentIds } = c.req.valid("json");
    const data = await listTaskSubtaskCount(parentIds);
    return c.json(data);
  }
);

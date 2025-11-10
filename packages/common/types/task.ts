import { z } from "zod";

export const TaskPriority = z.enum(["high", "med", "low"]);
export type TaskPriority = z.infer<typeof TaskPriority>;

export const TaskEffort = z.enum(["high", "med", "low"]);
export type TaskEffort = z.infer<typeof TaskEffort>;

export const TaskStatus = z.enum([
  "todo",
  "in progress",
  "blocked",
  "completed",
  "not done",
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

// Define TaskDTO schema with lazy reference for subtasks to handle circular references
type TaskDTOType = {
  id: string;
  userId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  completed: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  status: TaskStatus | null;
  effort: TaskEffort | null;
  groupId: string | null;
  isTemplate: boolean;
  templateId: string | null;
  priority: TaskPriority | null;
  assigneeId: string | null;
  subtasks?: TaskDTOType[];
  subtaskCount?: number;
  goal_id?: string;
};

const TaskDTOSchema: z.ZodType<TaskDTOType> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    parentId: z.string().uuid().nullable(),
    title: z.string(),
    description: z.string().nullable(),
    completed: z.boolean(),
    orderIndex: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    status: TaskStatus.nullable(),
    effort: TaskEffort.nullable(),
    groupId: z.string().uuid().nullable(),
    isTemplate: z.boolean(),
    templateId: z.string().uuid().nullable(),
    priority: TaskPriority.nullable(),
    assigneeId: z.string().uuid().nullable(),
    subtasks: z.array(TaskDTOSchema).optional(),
    subtaskCount: z.number().optional(),
    goal_id: z.string().uuid().optional(),
  })
);

export const TaskDTO = TaskDTOSchema;
export type TaskDTO = TaskDTOType;

const TaskFilterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
export const TaskFilterField = z.enum([
  "id",
  "status",
  "completed",
  "orderIndex",
  "createdAt",
  "updatedAt",
  "effort",
  "priority",
  "groupId",
  "parentId",
  "assigneeId",
  "isTemplate",
  "templateId",
  "title",
  "description",
  "goalId",
]);
export type TaskFilterField = z.infer<typeof TaskFilterField>;

export const TaskFilterCondition = z.object({
  eq: TaskFilterValueSchema.optional(),
  neq: TaskFilterValueSchema.optional(),
  in: z.array(TaskFilterValueSchema).optional(),
  nin: z.array(TaskFilterValueSchema).optional(),
  gt: TaskFilterValueSchema.optional(),
  gte: TaskFilterValueSchema.optional(),
  lt: TaskFilterValueSchema.optional(),
  lte: TaskFilterValueSchema.optional(),
  contains: z.string().optional(),
  is: z.boolean().optional(),
});
export type TaskFilterCondition = z.infer<typeof TaskFilterCondition>;

export const TaskFilterExpression = z.object({
  field: TaskFilterField,
  conditions: TaskFilterCondition,
});
export type TaskFilterExpression = z.infer<typeof TaskFilterExpression>;

export const TaskFilterDefinition = z.union([
  TaskFilterExpression,
  z.record(TaskFilterField, TaskFilterCondition),
]);
export type TaskFilterDefinition = z.infer<typeof TaskFilterDefinition>;

export const TaskSortOption = z.object({
  field: TaskFilterField,
  direction: z.enum(["asc", "desc"]).default("asc"),
});
export type TaskSortOption = z.infer<typeof TaskSortOption>;

export const TaskQuerySchema = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional(),
  search: z.string().max(256).optional(),
  filters: z.array(TaskFilterDefinition).optional(),
  sort: z.array(TaskSortOption).optional(),
});
export type TaskQuery = z.infer<typeof TaskQuerySchema>;

export const CreateTaskDTO = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatus.optional(),
  effort: TaskEffort.optional(),
  priority: TaskPriority.optional(),
  completed: z.boolean().optional(),
  parentId: z.string().uuid().optional(),
  goalId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  isTemplate: z.boolean().optional(),
  templateId: z.string().uuid().optional(),
  orderIndex: z.number().optional(),
});

export type CreateTaskDTO = z.infer<typeof CreateTaskDTO>;

export const UpdateTaskDTO = CreateTaskDTO.partial();
export type UpdateTaskDTO = z.infer<typeof UpdateTaskDTO>;

export const TaskGroupDTO = z.object({
  id: z.string().uuid(),
  title: z.string(),
  goalId: z.string().uuid(),
  userId: z.string().uuid(),
  orderIndex: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tasks: z.array(TaskDTO).optional(),
});

export type TaskGroupDTO = z.infer<typeof TaskGroupDTO>;

export const CreateTaskGroupDTO = z.object({
  title: z.string(),
  goalId: z.string().uuid(),
  orderIndex: z.number().optional(),
});

export type CreateTaskGroupDTO = z.infer<typeof CreateTaskGroupDTO>;

export const UpdateTaskGroupDTO = z.object({
  title: z.string().optional(),
  orderIndex: z.number().optional(),
});

export type UpdateTaskGroupDTO = z.infer<typeof UpdateTaskGroupDTO>;

export const TaskGoalDTO = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  goalId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type TaskGoalDTO = z.infer<typeof TaskGoalDTO>;

export const CreateTaskGoalDTO = z.object({
  taskId: z.string().uuid(),
  goalId: z.string().uuid(),
});

export type CreateTaskGoalDTO = z.infer<typeof CreateTaskGoalDTO>;

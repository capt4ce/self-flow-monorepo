import { getDb } from "@self-flow/db";
import { tasks } from "@self-flow/db/src/drizzle/schema";
import {
  CreateTaskDTO,
  TaskDTO,
  TaskEffort,
  TaskPriority,
  TaskStatus,
} from "@self-flow/common/types";
import type { Executor } from "../db/executor";

interface TaskInsertData {
  userId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus | null;
  effort?: TaskEffort | null;
  priority?: TaskPriority | null;
  completed?: boolean;
  parentId?: string | null;
  groupId?: string | null;
  isTemplate?: boolean;
  templateId?: string | null;
  orderIndex?: number;
}

/**
 * Insert a task into the database
 * @param userId - The ID of the user creating the task
 * @param data - The task data to insert
 * @param tx - Optional database transaction. If provided, uses the transaction; otherwise creates a new connection
 * @returns The created task
 */
export async function insertTask(
  userId: string,
  data: CreateTaskDTO,
  executor?: Executor
): Promise<TaskDTO> {
  const insertData: TaskInsertData = {
    userId,
    title: data.title,
    description: data.description || null,
    status: data.status || null,
    effort: data.effort || null,
    priority: data.priority || null,
    completed: data.completed || false,
    parentId: data.parentId || null,
    groupId: data.groupId || null,
    isTemplate: data.isTemplate || false,
    templateId: data.templateId || null,
    orderIndex: data.orderIndex || 0,
  };

  const executorToUse = executor || getDb();

  const [task] = await executorToUse
    .insert(tasks)
    .values(insertData)
    .returning();

  if (!task) {
    throw new Error("Failed to create task");
  }

  return task as TaskDTO;
}

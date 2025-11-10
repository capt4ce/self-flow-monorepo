import { getDb } from "@self-flow/db";
import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  UpdateTaskDTO,
  TaskDTO,
  TaskEffort,
  TaskPriority,
  TaskStatus,
} from "@self-flow/common/types";
import type { Transaction } from "../db/executor";

interface TaskUpdateData {
  updatedAt: string;
  title?: string;
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
 * Update a task in the database
 * @param userId - The ID of the user who owns the task
 * @param taskId - The ID of the task to update
 * @param data - The task data to update
 * @param tx - Optional database transaction. If provided, uses the transaction; otherwise creates a new connection
 * @returns The updated task
 * @throws Error if task not found
 */
export async function updateTaskRecord(
  userId: string,
  taskId: string,
  data: UpdateTaskDTO,
  tx?: Transaction
): Promise<TaskDTO> {
  const updateData: TaskUpdateData = {
    updatedAt: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined)
    updateData.description = data.description || null;
  if (data.status !== undefined) updateData.status = data.status || null;
  if (data.effort !== undefined) updateData.effort = data.effort || null;
  if (data.priority !== undefined) updateData.priority = data.priority || null;
  if (data.completed !== undefined) updateData.completed = data.completed;
  if (data.parentId !== undefined) updateData.parentId = data.parentId || null;
  if (data.groupId !== undefined) updateData.groupId = data.groupId || null;
  if (data.isTemplate !== undefined) updateData.isTemplate = data.isTemplate;
  if (data.templateId !== undefined)
    updateData.templateId = data.templateId || null;
  if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

  const [task] = await (tx || getDb())
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning();

  if (!task) {
    throw new Error("Task not found");
  }

  return task as TaskDTO;
}

import { getDb } from "@self-flow/db";
import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { UpdateTaskDTO, TaskDTO } from "@self-flow/common/types";

type Env = {
  DATABASE_URL?: string;
};

export async function updateTask(
  userId: string,
  taskId: string,
  data: UpdateTaskDTO,
  env?: Env
): Promise<TaskDTO> {
  const db = getDb(env);
  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.status !== undefined) updateData.status = data.status || null;
  if (data.effort !== undefined) updateData.effort = data.effort || null;
  if (data.priority !== undefined) updateData.priority = data.priority || null;
  if (data.completed !== undefined) updateData.completed = data.completed;
  if (data.parentId !== undefined) updateData.parentId = data.parentId || null;
  if (data.groupId !== undefined) updateData.groupId = data.groupId || null;
  if (data.isTemplate !== undefined) updateData.isTemplate = data.isTemplate;
  if (data.templateId !== undefined) updateData.templateId = data.templateId || null;
  if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

  const [task] = await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning();

  if (!task) {
    throw new Error("Task not found");
  }

  return task as TaskDTO;
}



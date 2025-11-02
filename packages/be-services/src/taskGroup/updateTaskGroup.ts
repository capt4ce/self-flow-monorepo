import { getDb } from "@self-flow/db";
import { taskGroups } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { UpdateTaskGroupDTO, TaskGroupDTO } from "@self-flow/common/types";

type Env = {
  DATABASE_URL?: string;
};

export async function updateTaskGroup(
  userId: string,
  groupId: string,
  data: UpdateTaskGroupDTO,
  env?: Env
): Promise<TaskGroupDTO> {
  const db = getDb(env);
  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

  const [group] = await db
    .update(taskGroups)
    .set(updateData)
    .where(and(eq(taskGroups.id, groupId), eq(taskGroups.userId, userId)))
    .returning();

  if (!group) {
    throw new Error("Task group not found");
  }

  return group as TaskGroupDTO;
}



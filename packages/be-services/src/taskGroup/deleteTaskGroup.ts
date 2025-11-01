import { db } from "@self-flow/db";
import { taskGroups, tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function deleteTaskGroup(userId: string, groupId: string): Promise<void> {
  // First, move tasks out of the group
  await db
    .update(tasks)
    .set({ groupId: null })
    .where(and(eq(tasks.groupId, groupId), eq(tasks.userId, userId)));

  // Then delete the group
  await db
    .delete(taskGroups)
    .where(and(eq(taskGroups.id, groupId), eq(taskGroups.userId, userId)));
}



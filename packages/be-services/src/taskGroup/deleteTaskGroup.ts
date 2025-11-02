import { getDb } from "@self-flow/db";
import { taskGroups, tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";

type Env = {
  DATABASE_URL?: string;
};

export async function deleteTaskGroup(userId: string, groupId: string, env?: Env): Promise<void> {
  const db = getDb(env);
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



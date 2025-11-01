import { db } from "@self-flow/db";
import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}



import { getDb } from "@self-flow/db";
import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";

type Env = {
  DATABASE_URL?: string;
};

export async function deleteTask(userId: string, taskId: string, env?: Env): Promise<void> {
  const db = getDb(env);
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}



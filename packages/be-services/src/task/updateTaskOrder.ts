import { getDb } from "@self-flow/db";
import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

type Env = {
  DATABASE_URL?: string;
};

export async function updateTaskOrder(
  userId: string,
  taskOrders: Array<{ taskId: string; orderIndex: number }>,
  env?: Env
): Promise<void> {
  const db = getDb(env);
  await Promise.all(
    taskOrders.map(({ taskId, orderIndex }) =>
      db
        .update(tasks)
        .set({ orderIndex })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    )
  );
}



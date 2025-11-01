import { db } from "@self-flow/db";
import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function updateTaskOrder(
  userId: string,
  taskOrders: Array<{ taskId: string; orderIndex: number }>
): Promise<void> {
  await Promise.all(
    taskOrders.map(({ taskId, orderIndex }) =>
      db
        .update(tasks)
        .set({ orderIndex })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    )
  );
}



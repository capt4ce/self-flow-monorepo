import { taskGoals } from "@self-flow/db/src/drizzle/schema";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type Transaction = Parameters<Parameters<NeonHttpDatabase["transaction"]>[0]>[0];

/**
 * Link a single task to a goal
 * @param taskId - The task ID to link
 * @param goalId - The goal ID to link the task to
 * @param tx - Optional database transaction. If not provided, will use db parameter
 * @param db - Optional database instance (used when tx is not provided)
 */
export async function linkTaskToGoal(
  taskId: string,
  goalId: string,
  tx?: Transaction,
  db?: any
): Promise<void> {
  const executor = tx || db;
  if (!executor) {
    throw new Error("Either tx or db must be provided");
  }

  await executor.insert(taskGoals).values({
    taskId,
    goalId,
  });
}

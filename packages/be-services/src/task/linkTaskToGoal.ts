import { getDb } from "@self-flow/db";
import { taskGoals } from "@self-flow/db/src/drizzle/schema";
import type { Executor } from "../db/executor";

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
  executor?: Executor
): Promise<void> {
  const executorToUse = executor || getDb();

  await executorToUse
    .insert(taskGoals)
    .values({
      taskId,
      goalId,
    })
    .onConflictDoNothing();
}

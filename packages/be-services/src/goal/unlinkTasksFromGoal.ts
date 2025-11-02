import { taskGoals } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type Transaction = Parameters<Parameters<NeonHttpDatabase["transaction"]>[0]>[0];

/**
 * Unlink tasks from a goal by removing task-goal relationships
 * @param goalId - The goal ID to unlink tasks from
 * @param taskIds - Array of task IDs to unlink
 * @param tx - Database transaction
 */
export async function unlinkTasksFromGoal(
  goalId: string,
  taskIds: string[],
  tx: Transaction
): Promise<void> {
  if (taskIds.length === 0) {
    return;
  }

  await tx
    .delete(taskGoals)
    .where(
      and(
        eq(taskGoals.goalId, goalId),
        inArray(taskGoals.taskId, taskIds)
      )
    );
}

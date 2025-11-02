import { tasks, taskGoals } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type Transaction = Parameters<Parameters<NeonHttpDatabase["transaction"]>[0]>[0];

/**
 * Link newly created tasks to a goal
 * @param taskIds - Array of task IDs to link
 * @param goalId - The goal ID to link tasks to
 * @param tx - Database transaction
 */
export async function linkNewTasksToGoal(
  taskIds: string[],
  goalId: string,
  tx: Transaction
): Promise<void> {
  if (taskIds.length === 0) {
    return;
  }

  await tx.insert(taskGoals).values(
    taskIds.map((taskId) => ({
      taskId,
      goalId,
    }))
  );
}

/**
 * Link existing tasks to a goal
 * Verifies that all tasks belong to the user before linking
 * @param userId - The ID of the user who owns the tasks
 * @param taskIds - Array of existing task IDs to link
 * @param goalId - The goal ID to link tasks to
 * @param tx - Database transaction
 * @throws Error if some tasks are not found or do not belong to the user
 */
export async function linkExistingTasksToGoal(
  userId: string,
  taskIds: string[],
  goalId: string,
  tx: Transaction
): Promise<void> {
  if (taskIds.length === 0) {
    return;
  }

  // Verify all tasks belong to the user
  const existingTasks = await tx
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.id, taskIds)
      )
    );

  if (existingTasks.length !== taskIds.length) {
    throw new Error("Some tasks not found or do not belong to user");
  }

  // Insert task-goal relationships (ignore conflicts for existing relationships)
  await tx
    .insert(taskGoals)
    .values(
      taskIds.map((taskId) => ({
        taskId,
        goalId,
      }))
    )
    .onConflictDoNothing();
}

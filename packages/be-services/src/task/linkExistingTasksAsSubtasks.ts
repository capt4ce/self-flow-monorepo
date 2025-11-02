import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type Transaction = Parameters<Parameters<NeonHttpDatabase["transaction"]>[0]>[0];

/**
 * Link existing tasks as subtasks by setting their parentId
 * Verifies that all tasks belong to the user before linking
 * @param userId - The ID of the user who owns the tasks
 * @param parentTaskId - The parent task ID
 * @param subtaskIds - Array of existing task IDs to link as subtasks
 * @param tx - Database transaction
 * @throws Error if some tasks are not found or do not belong to the user
 */
export async function linkExistingTasksAsSubtasks(
  userId: string,
  parentTaskId: string,
  subtaskIds: string[],
  tx: Transaction
): Promise<void> {
  if (subtaskIds.length === 0) {
    return;
  }

  // Verify all tasks belong to the user
  const existingTasks = await tx
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.id, subtaskIds)
      )
    );

  if (existingTasks.length !== subtaskIds.length) {
    throw new Error("Some tasks not found or do not belong to user");
  }

  // Update tasks to set parentId
  await tx
    .update(tasks)
    .set({ parentId: parentTaskId })
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.id, subtaskIds)
      )
    );
}

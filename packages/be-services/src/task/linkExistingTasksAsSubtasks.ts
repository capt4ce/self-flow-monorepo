import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { Executor } from "../db/executor";

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
  executor: Executor
): Promise<void> {
  if (subtaskIds.length === 0) {
    return;
  }

  // Verify all tasks belong to the user
  const existingTasks = await executor
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.id, subtaskIds)
      )
    );

  if (existingTasks.length === 0) {
    return;
  }

  const validSubtaskIds = Array.from(
    new Set(existingTasks.map((task) => task.id))
  );

  // Update tasks to set parentId
  await executor
    .update(tasks)
    .set({ parentId: parentTaskId })
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.id, validSubtaskIds)
      )
    );
}

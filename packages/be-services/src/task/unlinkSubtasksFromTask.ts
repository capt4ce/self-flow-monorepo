import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type Transaction = Parameters<Parameters<NeonHttpDatabase["transaction"]>[0]>[0];

/**
 * Unlink subtasks from a task by setting their parentId to null
 * @param userId - The ID of the user who owns the tasks
 * @param parentTaskId - The parent task ID
 * @param subtaskIds - Array of subtask IDs to unlink
 * @param tx - Database transaction
 */
export async function unlinkSubtasksFromTask(
  userId: string,
  parentTaskId: string,
  subtaskIds: string[],
  tx: Transaction
): Promise<void> {
  if (subtaskIds.length === 0) {
    return;
  }

  await tx
    .update(tasks)
    .set({ parentId: null })
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.id, subtaskIds),
        eq(tasks.parentId, parentTaskId)
      )
    );
}

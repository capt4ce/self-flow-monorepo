import { getDb } from "@self-flow/db";
import { goals } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { UpdateGoalDTO, GoalDTO } from "@self-flow/common/types";
import type { Executor } from "../db/executor";

/**
 * Update a goal in the database
 * @param userId - The ID of the user who owns the goal
 * @param goalId - The ID of the goal to update
 * @param data - The goal data to update
 * @param tx - Optional database transaction. If provided, uses the transaction; otherwise creates a new connection
 * @returns The updated goal
 * @throws Error if goal not found
 */
export async function updateGoalRecord(
  userId: string,
  goalId: string,
  data: UpdateGoalDTO,
  executor?: Executor
): Promise<GoalDTO> {
  const updateData: Partial<typeof goals.$inferInsert> & {
    updatedAt: string;
  } = {
    updatedAt: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined)
    updateData.description = data.description || null;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.startDate !== undefined)
    updateData.startDate = data.startDate || null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate || null;

  const executorToUse = executor || getDb();

  const [goal] = await executorToUse
    .update(goals)
    .set(updateData)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();

  if (!goal) {
    throw new Error("Goal not found");
  }

  return goal as GoalDTO;
}

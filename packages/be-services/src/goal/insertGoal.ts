import { getDb } from "@self-flow/db";
import { goals } from "@self-flow/db/src/drizzle/schema";
import { CreateGoalDTO, GoalDTO } from "@self-flow/common/types";
import type { Executor } from "../db/executor";

/**
 * Insert a goal into the database
 * @param userId - The ID of the user creating the goal
 * @param data - The goal data to insert
 * @param tx - Optional database transaction. If provided, uses the transaction; otherwise creates a new connection
 * @returns The created goal
 */
export async function insertGoal(
  userId: string,
  data: CreateGoalDTO,
  executor?: Executor
): Promise<GoalDTO> {
  const insertData: typeof goals.$inferInsert = {
    userId,
    title: data.title,
    description: data.description || null,
    category: data.category,
    status: data.status || "active",
    startDate: data.startDate || null,
    endDate: data.endDate || null,
  };

  const executorToUse = executor || getDb();

  const [goal] = await executorToUse
    .insert(goals)
    .values(insertData)
    .returning();

  if (!goal) {
    throw new Error("Failed to create goal");
  }

  return goal as GoalDTO;
}

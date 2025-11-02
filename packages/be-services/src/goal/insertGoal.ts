import { getDb } from "@self-flow/db";
import { goals } from "@self-flow/db/src/drizzle/schema";
import { CreateGoalDTO, GoalDTO } from "@self-flow/common/types";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type Transaction = Parameters<
  Parameters<NeonHttpDatabase["transaction"]>[0]
>[0];

interface GoalInsertData {
  userId: string;
  title: string;
  description?: string | null;
  category: CreateGoalDTO["category"];
  status?: CreateGoalDTO["status"];
  startDate?: string | null;
  endDate?: string | null;
}

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
  tx?: Transaction
): Promise<GoalDTO> {
  const insertData: GoalInsertData = {
    userId,
    title: data.title,
    description: data.description || null,
    category: data.category,
    status: data.status || "active",
    startDate: data.startDate || null,
    endDate: data.endDate || null,
  };

  const [goal] = await (tx || getDb())
    .insert(goals)
    .values(insertData)
    .returning();

  if (!goal) {
    throw new Error("Failed to create goal");
  }

  return goal as GoalDTO;
}

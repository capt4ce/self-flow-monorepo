import { getDb } from "@self-flow/db";
import { goals } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const db = getDb();
  await db
    .delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
}



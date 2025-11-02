import { getDb } from "@self-flow/db";
import { goals } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";

type Env = {
  DATABASE_URL?: string;
};

export async function deleteGoal(userId: string, goalId: string, env?: Env): Promise<void> {
  const db = getDb(env);
  await db
    .delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
}



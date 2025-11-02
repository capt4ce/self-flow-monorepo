import { getDb } from "@self-flow/db";
import { goals } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { UpdateGoalDTO, GoalDTO } from "@self-flow/common/types";

type Env = {
  DATABASE_URL?: string;
};

export async function updateGoal(
  userId: string,
  goalId: string,
  data: UpdateGoalDTO,
  env?: Env
): Promise<GoalDTO> {
  const db = getDb(env);
  const [goal] = await db
    .update(goals)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.startDate !== undefined && { startDate: data.startDate || null }),
      ...(data.endDate !== undefined && { endDate: data.endDate || null }),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();

  if (!goal) {
    throw new Error("Goal not found");
  }

  return goal as GoalDTO;
}



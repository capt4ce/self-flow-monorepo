import { db } from "@self-flow/db";
import { goals } from "@self-flow/db/src/drizzle/schema";
import { CreateGoalDTO } from "@self-flow/common/types";
import { GoalDTO } from "@self-flow/common/types";

export async function createGoal(userId: string, data: CreateGoalDTO): Promise<GoalDTO> {
  const [goal] = await db
    .insert(goals)
    .values({
      userId,
      title: data.title,
      description: data.description || null,
      category: data.category,
      status: data.status || "active",
      startDate: data.startDate || null,
      endDate: data.endDate || null,
    })
    .returning();

  return goal as GoalDTO;
}



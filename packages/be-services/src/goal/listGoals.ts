import { getDb } from "@self-flow/db";
import { goals, taskGoals, tasks, taskGroups } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { GoalDTO } from "@self-flow/common/types";
import type { GoalStatus } from "@self-flow/common/types";

export async function listGoals(userId: string, status: GoalStatus | undefined) {
  const db = getDb();
  // Ensure status is valid, default to "active" if not provided or invalid
  const validStatus: "active" | "done" = status === "active" || status === "done" ? status : "active";
  
  const goalsList = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, validStatus)))
    .orderBy(goals.createdAt);

  // Get tasks for each goal
  const goalsWithTasks = await Promise.all(
    goalsList.map(async (goal) => {
      // Get task-goal relationships
      const taskGoalRelations = await db
        .select()
        .from(taskGoals)
        .where(eq(taskGoals.goalId, goal.id));

      if (taskGoalRelations.length === 0) {
        return {
          ...goal,
          tasks: [],
          taskGroups: [],
        };
      }

      const taskIds = taskGoalRelations.map((tg) => tg.taskId);

      // Get tasks
      const tasksList = taskIds.length > 0
        ? await db
            .select()
            .from(tasks)
            .where(
              and(
                eq(tasks.userId, userId),
                inArray(tasks.id, taskIds)
              )
            )
            .orderBy(tasks.orderIndex)
        : [];

      // Get task groups
      const groupsList = await db
        .select()
        .from(taskGroups)
        .where(eq(taskGroups.goalId, goal.id));

      // Sort tasks by order_index
      const sortedTasks = tasksList.sort((a, b) => a.orderIndex - b.orderIndex);

      return {
        ...goal,
        tasks: sortedTasks,
        taskGroups: groupsList,
      };
    })
  );

  return goalsWithTasks as GoalDTO[];
}


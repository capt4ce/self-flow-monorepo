import { db } from "@self-flow/db";
import { tasks, taskGoals, goals } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { TaskDTO } from "@self-flow/common/types";

export async function listTasks(userId: string, limit: number = 20, offset: number = 0) {
  const tasksList = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .limit(limit)
    .offset(offset)
    .orderBy(tasks.orderIndex);

  // Get task-goal relationships for these tasks
  const taskIds = tasksList.map((t) => t.id);
  const taskGoalRelations = taskIds.length > 0
    ? await db
        .select()
        .from(taskGoals)
        .where(inArray(taskGoals.taskId, taskIds))
    : [];

  // Get goals for these relationships
  const goalIds = [...new Set(taskGoalRelations.map((tg) => tg.goalId))];
  const goalsList = goalIds.length > 0
    ? await db
        .select()
        .from(goals)
        .where(inArray(goals.id, goalIds))
    : [];

  // Create a map of taskId -> goal
  const goalMap = new Map<string, typeof goalsList[0]>();
  goalsList.forEach((goal) => goalMap.set(goal.id, goal));

  const taskGoalMap = new Map<string, typeof taskGoalRelations[0]>();
  taskGoalRelations.forEach((tg) => taskGoalMap.set(tg.taskId, tg));

  // Attach goal info to tasks
  const tasksWithGoals = tasksList.map((task) => {
    const tg = taskGoalMap.get(task.id);
    const goal = tg ? goalMap.get(tg.goalId) : null;
    return {
      ...task,
      goalTitle: goal?.title || "",
      goalId: goal?.id || "",
    };
  });

  return tasksWithGoals as TaskDTO[];
}



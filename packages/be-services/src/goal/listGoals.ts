import { getDb } from "@self-flow/db";
import {
  goals,
  taskGoals,
  tasks,
  taskGroups,
} from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { GoalDTO } from "@self-flow/common/types";
import type { GoalStatus } from "@self-flow/common/types";

export async function listGoals(
  userId: string,
  status: GoalStatus | undefined
) {
  const db = getDb();
  // Ensure status is valid, default to "active" if not provided or invalid
  const validStatus: "active" | "done" =
    status === "active" || status === "done" ? status : "active";

  const goalsList = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, validStatus)))
    .orderBy(goals.createdAt);

  // Get tasks for each goal
  if (goalsList.length === 0) {
    return [] as GoalDTO[];
  }

  const goalIds = goalsList.map((goal) => goal.id);

  const [taskRows, groupRows] = await Promise.all([
    db
      .select({
        goalId: taskGoals.goalId,
        task: tasks,
      })
      .from(taskGoals)
      .innerJoin(
        tasks,
        and(eq(taskGoals.taskId, tasks.id), eq(tasks.userId, userId))
      )
      .where(inArray(taskGoals.goalId, goalIds))
      .orderBy(taskGoals.goalId, tasks.orderIndex),
    db
      .select({
        goalId: taskGroups.goalId,
        group: taskGroups,
      })
      .from(taskGroups)
      .where(inArray(taskGroups.goalId, goalIds)),
  ]);

  const parentTaskIds = taskRows.map((row) => row.task.id);

  const subtaskRows =
    parentTaskIds.length > 0
      ? await db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.userId, userId),
              inArray(tasks.parentId, parentTaskIds)
            )
          )
          .orderBy(tasks.parentId, tasks.orderIndex)
      : [];

  const subtaskIds = subtaskRows.map((task) => task.id);

  const grandchildRows =
    subtaskIds.length > 0
      ? await db
          .select({
            parentId: tasks.parentId,
          })
          .from(tasks)
          .where(
            and(eq(tasks.userId, userId), inArray(tasks.parentId, subtaskIds))
          )
      : [];

  const grandchildCountMap = new Map<string, number>();
  for (const row of grandchildRows) {
    if (!row.parentId) continue;
    grandchildCountMap.set(
      row.parentId,
      (grandchildCountMap.get(row.parentId) ?? 0) + 1
    );
  }

  type TaskSelect = typeof tasks.$inferSelect;
  type TaskGroupSelect = typeof taskGroups.$inferSelect;

  const tasksByGoal = new Map<string, TaskSelect[]>();
  for (const row of taskRows) {
    const list = tasksByGoal.get(row.goalId);
    if (list) {
      list.push(row.task);
    } else {
      tasksByGoal.set(row.goalId, [row.task]);
    }
  }

  const taskGroupsByGoal = new Map<string, TaskGroupSelect[]>();
  for (const row of groupRows) {
    const list = taskGroupsByGoal.get(row.goalId);
    if (list) {
      list.push(row.group);
    } else {
      taskGroupsByGoal.set(row.goalId, [row.group]);
    }
  }

  const subtasksByParent = new Map<string, TaskSelect[]>();
  for (const subtask of subtaskRows) {
    if (!subtask.parentId) {
      continue;
    }

    const existing = subtasksByParent.get(subtask.parentId);
    if (existing) {
      existing.push(subtask);
    } else {
      subtasksByParent.set(subtask.parentId, [subtask]);
    }
  }

  for (const [, subtasks] of subtasksByParent) {
    subtasks.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }

  const goalsWithTasks = goalsList.map((goal) => {
    const relatedTasks = (tasksByGoal.get(goal.id) ?? [])
      .map((task) => {
        const subtasks = (subtasksByParent.get(task.id) ?? []).map(
          (subtask) => ({
            ...subtask,
            goal_id: goal.id,
            subtaskCount: grandchildCountMap.get(subtask.id) ?? 0,
            subtasks: [],
          })
        );

        return {
          ...task,
          goal_id: goal.id,
          subtaskCount: subtasks.length,
          subtasks,
        };
      })
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

    return {
      ...goal,
      tasks: relatedTasks,
      taskGroups: taskGroupsByGoal.get(goal.id) ?? [],
    };
  });

  return goalsWithTasks as GoalDTO[];
}

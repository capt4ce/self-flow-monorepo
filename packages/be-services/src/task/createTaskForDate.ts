import { getDb } from "@self-flow/db";
import { goals } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TaskDTO } from "@self-flow/common/types";
import { insertGoal } from "../goal/insertGoal";
import {
  CreateTaskWithSubtasksDTO,
  createTaskWithSubtasks,
} from "../lib/createTaskWithSubtasks";

/**
 * Create a task for a specific date. If a daily goal doesn't exist for that date,
 * it will be created automatically and the task will be associated with it.
 * @param userId - The ID of the user creating the task
 * @param date - The date string in YYYY-MM-DD format
 * @param data - The task data to create
 * @returns The created task
 */
export async function createTaskForDate(
  userId: string,
  date: string,
  data: CreateTaskWithSubtasksDTO
): Promise<TaskDTO> {
  const db = getDb();

  return await db.transaction(async (tx) => {
    // 1. Check if a daily goal exists for this date
    const existingDailyGoals = await tx
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.userId, userId),
          eq(goals.category, "Daily"),
          eq(goals.startDate, date),
          eq(goals.endDate, date)
        )
      )
      .limit(1);

    let dailyGoalId: string;

    if (existingDailyGoals.length > 0) {
      // Use existing daily goal
      dailyGoalId = existingDailyGoals[0].id;
    } else {
      // Create a new daily goal for this date
      // Validate date format and create formatted date string
      const dateObj = new Date(date + "T00:00:00"); // Add time to avoid timezone issues
      if (isNaN(dateObj.getTime())) {
        throw new Error(
          `Invalid date format: ${date}. Expected YYYY-MM-DD format.`
        );
      }

      const formattedDate = dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const dailyGoal = await insertGoal(
        userId,
        {
          title: `Daily Goal - ${formattedDate}`,
          description: `Tasks for ${formattedDate}`,
          category: "Daily",
          status: "active",
          startDate: date,
          endDate: date,
        },
        tx
      );
      dailyGoalId = dailyGoal.id;
    }

    // 2. Create the task with subtasks and link to daily goal
    // Remove goalId from data if present, as we'll use the daily goal instead
    const { goalId: _, ...taskData } = data;
    return await createTaskWithSubtasks(userId, taskData, tx, dailyGoalId);
  });
}

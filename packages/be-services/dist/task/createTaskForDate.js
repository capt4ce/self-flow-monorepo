"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskForDate = createTaskForDate;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const insertGoal_1 = require("../goal/insertGoal");
const createTaskWithSubtasks_1 = require("../lib/createTaskWithSubtasks");
/**
 * Create a task for a specific date. If a daily goal doesn't exist for that date,
 * it will be created automatically and the task will be associated with it.
 * @param userId - The ID of the user creating the task
 * @param date - The date string in YYYY-MM-DD format
 * @param data - The task data to create
 * @returns The created task
 */
async function createTaskForDate(userId, date, data) {
    const db = (0, db_1.getDb)();
    return await db.transaction(async (tx) => {
        // 1. Check if a daily goal exists for this date
        const existingDailyGoals = await tx
            .select()
            .from(schema_1.goals)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.goals.userId, userId), (0, drizzle_orm_1.eq)(schema_1.goals.category, "Daily"), (0, drizzle_orm_1.eq)(schema_1.goals.startDate, date), (0, drizzle_orm_1.eq)(schema_1.goals.endDate, date)))
            .limit(1);
        let dailyGoalId;
        if (existingDailyGoals.length > 0) {
            // Use existing daily goal
            dailyGoalId = existingDailyGoals[0].id;
        }
        else {
            // Create a new daily goal for this date
            // Validate date format and create formatted date string
            const dateObj = new Date(date + "T00:00:00"); // Add time to avoid timezone issues
            if (isNaN(dateObj.getTime())) {
                throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD format.`);
            }
            const formattedDate = dateObj.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            const dailyGoal = await (0, insertGoal_1.insertGoal)(userId, {
                title: `Daily Goal - ${formattedDate}`,
                description: `Tasks for ${formattedDate}`,
                category: "Daily",
                status: "active",
                startDate: date,
                endDate: date,
            }, tx);
            dailyGoalId = dailyGoal.id;
        }
        // 2. Create the task with subtasks and link to daily goal
        // Remove goalId from data if present, as we'll use the daily goal instead
        const { goalId: _, ...taskData } = data;
        return await (0, createTaskWithSubtasks_1.createTaskWithSubtasks)(userId, taskData, tx, dailyGoalId);
    });
}

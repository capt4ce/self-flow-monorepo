"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkNewTasksToGoal = linkNewTasksToGoal;
exports.linkExistingTasksToGoal = linkExistingTasksToGoal;
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Link newly created tasks to a goal
 * @param taskIds - Array of task IDs to link
 * @param goalId - The goal ID to link tasks to
 * @param tx - Database transaction
 */
async function linkNewTasksToGoal(taskIds, goalId, executor) {
    if (taskIds.length === 0) {
        return;
    }
    await executor.insert(schema_1.taskGoals).values(taskIds.map((taskId) => ({
        taskId,
        goalId,
    })));
}
/**
 * Link existing tasks to a goal
 * Verifies that all tasks belong to the user before linking
 * @param userId - The ID of the user who owns the tasks
 * @param taskIds - Array of existing task IDs to link
 * @param goalId - The goal ID to link tasks to
 * @param tx - Database transaction
 * @throws Error if some tasks are not found or do not belong to the user
 */
async function linkExistingTasksToGoal(userId, taskIds, goalId, executor) {
    if (taskIds.length === 0) {
        return;
    }
    // Verify all tasks belong to the user
    const existingTasks = await executor
        .select()
        .from(schema_1.tasks)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId), (0, drizzle_orm_1.inArray)(schema_1.tasks.id, taskIds)));
    if (existingTasks.length === 0) {
        return;
    }
    const validTaskIds = Array.from(new Set(existingTasks.map((task) => task.id)));
    // Insert task-goal relationships (ignore conflicts for existing relationships)
    await executor
        .insert(schema_1.taskGoals)
        .values(validTaskIds.map((taskId) => ({
        taskId,
        goalId,
    })))
        .onConflictDoNothing();
}

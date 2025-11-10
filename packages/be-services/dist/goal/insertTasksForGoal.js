"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertTasksForGoal = insertTasksForGoal;
const schema_1 = require("@self-flow/db/src/drizzle/schema");
/**
 * Insert new tasks for a goal
 * @param userId - The ID of the user creating the tasks
 * @param newTasks - Array of task data to create (without goalId)
 * @param tx - Database transaction
 * @returns Array of created tasks
 */
async function insertTasksForGoal(userId, newTasks, executor) {
    const tasksToCreate = newTasks
        .filter((t) => t.title?.trim())
        .map((task) => ({
        userId,
        title: task.title,
        description: task.description || null,
        status: task.status || null,
        effort: task.effort || null,
        priority: task.priority || null,
        completed: task.completed || false,
        parentId: task.parentId || null,
        groupId: task.groupId || null,
        isTemplate: task.isTemplate || false,
        templateId: task.templateId || null,
        orderIndex: task.orderIndex || 0,
    }));
    if (tasksToCreate.length === 0) {
        return [];
    }
    const createdTasks = await executor
        .insert(schema_1.tasks)
        .values(tasksToCreate)
        .returning();
    return createdTasks;
}

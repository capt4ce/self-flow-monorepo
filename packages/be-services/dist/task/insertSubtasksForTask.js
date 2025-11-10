"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertSubtasksForTask = insertSubtasksForTask;
const schema_1 = require("@self-flow/db/src/drizzle/schema");
/**
 * Insert new subtasks for a task
 * @param userId - The ID of the user creating the subtasks
 * @param parentTaskId - The ID of the parent task
 * @param newSubtasks - Array of subtask data to create (without parentId)
 * @param tx - Database transaction
 * @returns Array of created subtasks
 */
async function insertSubtasksForTask(userId, parentTaskId, newSubtasks, executor) {
    const subtasksToCreate = newSubtasks
        .filter((st) => st.title?.trim())
        .map((subtask) => ({
        userId,
        title: subtask.title,
        description: subtask.description || null,
        status: subtask.status || null,
        effort: subtask.effort || null,
        priority: subtask.priority || null,
        completed: subtask.completed || false,
        parentId: parentTaskId,
        groupId: subtask.groupId || null,
        isTemplate: subtask.isTemplate || false,
        templateId: subtask.templateId || null,
        orderIndex: subtask.orderIndex || 0,
    }));
    if (subtasksToCreate.length === 0) {
        return [];
    }
    const createdSubtasks = await executor
        .insert(schema_1.tasks)
        .values(subtasksToCreate)
        .returning();
    return createdSubtasks;
}

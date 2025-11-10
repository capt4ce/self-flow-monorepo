"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkExistingTasksAsSubtasks = linkExistingTasksAsSubtasks;
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Link existing tasks as subtasks by setting their parentId
 * Verifies that all tasks belong to the user before linking
 * @param userId - The ID of the user who owns the tasks
 * @param parentTaskId - The parent task ID
 * @param subtaskIds - Array of existing task IDs to link as subtasks
 * @param tx - Database transaction
 * @throws Error if some tasks are not found or do not belong to the user
 */
async function linkExistingTasksAsSubtasks(userId, parentTaskId, subtaskIds, executor) {
    if (subtaskIds.length === 0) {
        return;
    }
    // Verify all tasks belong to the user
    const existingTasks = await executor
        .select()
        .from(schema_1.tasks)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId), (0, drizzle_orm_1.inArray)(schema_1.tasks.id, subtaskIds)));
    if (existingTasks.length === 0) {
        return;
    }
    const validSubtaskIds = Array.from(new Set(existingTasks.map((task) => task.id)));
    // Update tasks to set parentId
    await executor
        .update(schema_1.tasks)
        .set({ parentId: parentTaskId })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId), (0, drizzle_orm_1.inArray)(schema_1.tasks.id, validSubtaskIds)));
}

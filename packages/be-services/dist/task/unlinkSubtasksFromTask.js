"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlinkSubtasksFromTask = unlinkSubtasksFromTask;
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Unlink subtasks from a task by setting their parentId to null
 * @param userId - The ID of the user who owns the tasks
 * @param parentTaskId - The parent task ID
 * @param subtaskIds - Array of subtask IDs to unlink
 * @param tx - Database transaction
 */
async function unlinkSubtasksFromTask(userId, parentTaskId, subtaskIds, tx) {
    if (subtaskIds.length === 0) {
        return;
    }
    await tx
        .update(schema_1.tasks)
        .set({ parentId: null })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId), (0, drizzle_orm_1.inArray)(schema_1.tasks.id, subtaskIds), (0, drizzle_orm_1.eq)(schema_1.tasks.parentId, parentTaskId)));
}

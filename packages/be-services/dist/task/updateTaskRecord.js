"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskRecord = updateTaskRecord;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Update a task in the database
 * @param userId - The ID of the user who owns the task
 * @param taskId - The ID of the task to update
 * @param data - The task data to update
 * @param tx - Optional database transaction. If provided, uses the transaction; otherwise creates a new connection
 * @returns The updated task
 * @throws Error if task not found
 */
async function updateTaskRecord(userId, taskId, data, tx) {
    const updateData = {
        updatedAt: new Date().toISOString(),
    };
    if (data.title !== undefined)
        updateData.title = data.title;
    if (data.description !== undefined)
        updateData.description = data.description || null;
    if (data.status !== undefined)
        updateData.status = data.status || null;
    if (data.effort !== undefined)
        updateData.effort = data.effort || null;
    if (data.priority !== undefined)
        updateData.priority = data.priority || null;
    if (data.completed !== undefined)
        updateData.completed = data.completed;
    if (data.parentId !== undefined)
        updateData.parentId = data.parentId || null;
    if (data.groupId !== undefined)
        updateData.groupId = data.groupId || null;
    if (data.isTemplate !== undefined)
        updateData.isTemplate = data.isTemplate;
    if (data.templateId !== undefined)
        updateData.templateId = data.templateId || null;
    if (data.orderIndex !== undefined)
        updateData.orderIndex = data.orderIndex;
    const [task] = await (tx || (0, db_1.getDb)())
        .update(schema_1.tasks)
        .set(updateData)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId)))
        .returning();
    if (!task) {
        throw new Error("Task not found");
    }
    return task;
}

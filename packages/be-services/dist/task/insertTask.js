"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertTask = insertTask;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
/**
 * Insert a task into the database
 * @param userId - The ID of the user creating the task
 * @param data - The task data to insert
 * @param tx - Optional database transaction. If provided, uses the transaction; otherwise creates a new connection
 * @returns The created task
 */
async function insertTask(userId, data, executor) {
    const insertData = {
        userId,
        title: data.title,
        description: data.description || null,
        status: data.status || null,
        effort: data.effort || null,
        priority: data.priority || null,
        completed: data.completed || false,
        parentId: data.parentId || null,
        groupId: data.groupId || null,
        isTemplate: data.isTemplate || false,
        templateId: data.templateId || null,
        orderIndex: data.orderIndex || 0,
    };
    const executorToUse = executor || (0, db_1.getDb)();
    const [task] = await executorToUse
        .insert(schema_1.tasks)
        .values(insertData)
        .returning();
    if (!task) {
        throw new Error("Failed to create task");
    }
    return task;
}

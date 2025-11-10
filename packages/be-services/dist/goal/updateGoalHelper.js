"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGoalRecord = updateGoalRecord;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Update a goal in the database
 * @param userId - The ID of the user who owns the goal
 * @param goalId - The ID of the goal to update
 * @param data - The goal data to update
 * @param tx - Optional database transaction. If provided, uses the transaction; otherwise creates a new connection
 * @returns The updated goal
 * @throws Error if goal not found
 */
async function updateGoalRecord(userId, goalId, data, executor) {
    const updateData = {
        updatedAt: new Date().toISOString(),
    };
    if (data.title !== undefined)
        updateData.title = data.title;
    if (data.description !== undefined)
        updateData.description = data.description || null;
    if (data.category !== undefined)
        updateData.category = data.category;
    if (data.status !== undefined)
        updateData.status = data.status;
    if (data.startDate !== undefined)
        updateData.startDate = data.startDate || null;
    if (data.endDate !== undefined)
        updateData.endDate = data.endDate || null;
    const executorToUse = executor || (0, db_1.getDb)();
    const [goal] = await executorToUse
        .update(schema_1.goals)
        .set(updateData)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.goals.id, goalId), (0, drizzle_orm_1.eq)(schema_1.goals.userId, userId)))
        .returning();
    if (!goal) {
        throw new Error("Goal not found");
    }
    return goal;
}

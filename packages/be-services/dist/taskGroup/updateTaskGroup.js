"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskGroup = updateTaskGroup;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function updateTaskGroup(userId, groupId, data) {
    const db = (0, db_1.getDb)();
    const updateData = {
        updatedAt: new Date().toISOString(),
    };
    if (data.title !== undefined)
        updateData.title = data.title;
    if (data.orderIndex !== undefined)
        updateData.orderIndex = data.orderIndex;
    const [group] = await db
        .update(schema_1.taskGroups)
        .set(updateData)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.taskGroups.id, groupId), (0, drizzle_orm_1.eq)(schema_1.taskGroups.userId, userId)))
        .returning();
    if (!group) {
        throw new Error("Task group not found");
    }
    return group;
}

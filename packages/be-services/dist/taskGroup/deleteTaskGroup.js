"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTaskGroup = deleteTaskGroup;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function deleteTaskGroup(userId, groupId) {
    const db = (0, db_1.getDb)();
    // First, move tasks out of the group
    await db
        .update(schema_1.tasks)
        .set({ groupId: null })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.groupId, groupId), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId)));
    // Then delete the group
    await db
        .delete(schema_1.taskGroups)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.taskGroups.id, groupId), (0, drizzle_orm_1.eq)(schema_1.taskGroups.userId, userId)));
}

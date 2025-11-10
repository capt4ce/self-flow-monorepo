"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskGroup = createTaskGroup;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
async function createTaskGroup(userId, data) {
    const db = (0, db_1.getDb)();
    const [group] = await db
        .insert(schema_1.taskGroups)
        .values({
        userId,
        title: data.title,
        goalId: data.goalId,
        orderIndex: data.orderIndex || 0,
    })
        .returning();
    return group;
}

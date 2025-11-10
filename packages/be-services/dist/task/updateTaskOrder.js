"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskOrder = updateTaskOrder;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function updateTaskOrder(userId, taskOrders) {
    const db = (0, db_1.getDb)();
    await Promise.all(taskOrders.map(({ taskId, orderIndex }) => db
        .update(schema_1.tasks)
        .set({ orderIndex })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId), (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId)))));
}

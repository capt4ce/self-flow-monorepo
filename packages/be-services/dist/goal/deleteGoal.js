"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGoal = deleteGoal;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function deleteGoal(userId, goalId) {
    const db = (0, db_1.getDb)();
    await db
        .delete(schema_1.goals)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.goals.id, goalId), (0, drizzle_orm_1.eq)(schema_1.goals.userId, userId)));
}

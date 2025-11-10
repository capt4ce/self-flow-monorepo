"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTaskSubtaskCount = listTaskSubtaskCount;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_orm_2 = require("drizzle-orm");
async function listTaskSubtaskCount(parentIds) {
    if (parentIds.length === 0) {
        return [];
    }
    const db = (0, db_1.getDb)();
    const counts = await db
        .select({
        parentId: schema_1.tasks.parentId,
        count: (0, drizzle_orm_2.sql) `count(*)`.as("count"),
    })
        .from(schema_1.tasks)
        .where((0, drizzle_orm_1.inArray)(schema_1.tasks.parentId, parentIds))
        .groupBy(schema_1.tasks.parentId);
    return counts.map((c) => ({
        parent_id: c.parentId,
        subtaskCount: Number(c.count),
    }));
}

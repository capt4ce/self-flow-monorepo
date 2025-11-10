"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSubtasks = listSubtasks;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function listSubtasks(userId, parentIds) {
    if (parentIds.length === 0) {
        return {};
    }
    const db = (0, db_1.getDb)();
    const subtasksList = await db
        .select()
        .from(schema_1.tasks)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId), (0, drizzle_orm_1.inArray)(schema_1.tasks.parentId, parentIds)))
        .orderBy(schema_1.tasks.orderIndex);
    // Group by parent_id
    const subtaskMap = {};
    subtasksList.forEach((task) => {
        if (task.parentId) {
            if (!subtaskMap[task.parentId]) {
                subtaskMap[task.parentId] = [];
            }
            subtaskMap[task.parentId].push(task);
        }
    });
    return subtaskMap;
}

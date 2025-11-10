"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlinkTasksFromGoal = unlinkTasksFromGoal;
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Unlink tasks from a goal by removing task-goal relationships
 * @param goalId - The goal ID to unlink tasks from
 * @param taskIds - Array of task IDs to unlink
 * @param tx - Database transaction
 */
async function unlinkTasksFromGoal(goalId, taskIds, executor) {
    if (taskIds.length === 0) {
        return;
    }
    await executor
        .delete(schema_1.taskGoals)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.taskGoals.goalId, goalId), (0, drizzle_orm_1.inArray)(schema_1.taskGoals.taskId, taskIds)));
}

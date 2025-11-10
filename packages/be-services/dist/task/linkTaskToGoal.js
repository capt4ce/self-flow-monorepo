"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkTaskToGoal = linkTaskToGoal;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
/**
 * Link a single task to a goal
 * @param taskId - The task ID to link
 * @param goalId - The goal ID to link the task to
 * @param tx - Optional database transaction. If not provided, will use db parameter
 * @param db - Optional database instance (used when tx is not provided)
 */
async function linkTaskToGoal(taskId, goalId, executor) {
    const executorToUse = executor || (0, db_1.getDb)();
    await executorToUse
        .insert(schema_1.taskGoals)
        .values({
        taskId,
        goalId,
    })
        .onConflictDoNothing();
}

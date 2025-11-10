"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertGoal = insertGoal;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
/**
 * Insert a goal into the database
 * @param userId - The ID of the user creating the goal
 * @param data - The goal data to insert
 * @param tx - Optional database transaction. If provided, uses the transaction; otherwise creates a new connection
 * @returns The created goal
 */
async function insertGoal(userId, data, executor) {
    const insertData = {
        userId,
        title: data.title,
        description: data.description || null,
        category: data.category,
        status: data.status || "active",
        startDate: data.startDate || null,
        endDate: data.endDate || null,
    };
    const executorToUse = executor || (0, db_1.getDb)();
    const [goal] = await executorToUse
        .insert(schema_1.goals)
        .values(insertData)
        .returning();
    if (!goal) {
        throw new Error("Failed to create goal");
    }
    return goal;
}

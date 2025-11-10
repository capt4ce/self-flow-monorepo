"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
const db_1 = require("@self-flow/db");
const insertTask_1 = require("./insertTask");
const linkTaskToGoal_1 = require("./linkTaskToGoal");
const createTaskWithSubtasks_1 = require("../lib/createTaskWithSubtasks");
async function createTask(userId, data) {
    const db = (0, db_1.getDb)();
    // Check if we need to handle subtasks (batch operation)
    const hasSubtasks = (data.newSubtasks && data.newSubtasks.length > 0) ||
        (data.existingSubtaskIds && data.existingSubtaskIds.length > 0);
    // Handle goalId separately via task_goals if provided
    const goalId = data.goalId;
    if (hasSubtasks) {
        // Use transaction for batch operation
        return await db.transaction(async (tx) => {
            // Remove goalId from data as it's handled separately
            const { goalId: _, ...taskData } = data;
            return await (0, createTaskWithSubtasks_1.createTaskWithSubtasks)(userId, taskData, tx, goalId);
        });
    }
    else {
        // Simple create without subtasks
        const { goalId: _, ...taskData } = data;
        const task = await (0, insertTask_1.insertTask)(userId, taskData, db);
        // If goalId is provided, create task-goal relationship
        if (goalId) {
            await (0, linkTaskToGoal_1.linkTaskToGoal)(task.id, goalId, db);
        }
        return task;
    }
}

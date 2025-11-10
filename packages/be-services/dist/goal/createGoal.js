"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGoal = createGoal;
const db_1 = require("@self-flow/db");
const insertGoal_1 = require("./insertGoal");
const insertTasksForGoal_1 = require("./insertTasksForGoal");
const linkTasksToGoal_1 = require("./linkTasksToGoal");
async function createGoal(userId, data) {
    const db = (0, db_1.getDb)();
    // Check if we need to handle tasks (batch operation)
    const hasTasks = (data.newTasks && data.newTasks.length > 0) ||
        (data.existingTaskIds && data.existingTaskIds.length > 0);
    if (hasTasks) {
        // Use transaction for batch operation
        return await db.transaction(async (tx) => {
            // 1. Create the goal
            const goal = await (0, insertGoal_1.insertGoal)(userId, data, tx);
            const goalId = goal.id;
            // 2. Create new tasks if any
            if (data.newTasks && data.newTasks.length > 0) {
                const createdTasks = await (0, insertTasksForGoal_1.insertTasksForGoal)(userId, data.newTasks, tx);
                // 3. Link new tasks to goal via task_goals junction table
                if (createdTasks.length > 0) {
                    await (0, linkTasksToGoal_1.linkNewTasksToGoal)(createdTasks.map((task) => task.id), goalId, tx);
                }
            }
            // 4. Link existing tasks to goal if any
            if (data.existingTaskIds && data.existingTaskIds.length > 0) {
                await (0, linkTasksToGoal_1.linkExistingTasksToGoal)(userId, data.existingTaskIds, goalId, tx);
            }
            return goal;
        });
    }
    else {
        // Simple create without tasks
        return await (0, insertGoal_1.insertGoal)(userId, data, db);
    }
}

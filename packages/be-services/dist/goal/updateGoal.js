"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGoal = updateGoal;
const db_1 = require("@self-flow/db");
const updateGoalHelper_1 = require("./updateGoalHelper");
const insertTasksForGoal_1 = require("./insertTasksForGoal");
const linkTasksToGoal_1 = require("./linkTasksToGoal");
const unlinkTasksFromGoal_1 = require("./unlinkTasksFromGoal");
async function updateGoal(userId, goalId, data) {
    const db = (0, db_1.getDb)();
    // Check if we need to handle tasks (batch operation)
    const hasNewTasks = data.newTasks && data.newTasks.length > 0;
    const hasTaskRelationships = (data.selectedTaskIds && data.selectedTaskIds.length > 0) ||
        (data.currentTaskIds && data.currentTaskIds.length > 0);
    const hasTasks = hasNewTasks || hasTaskRelationships;
    if (hasTasks) {
        // Use transaction for batch operation
        return await db.transaction(async (tx) => {
            // Extract task-related data before passing to updateGoalRecord
            const { newTasks, selectedTaskIds, currentTaskIds, ...goalUpdateData } = data;
            // 1. Update the goal
            const goal = await (0, updateGoalHelper_1.updateGoalRecord)(userId, goalId, goalUpdateData, tx);
            // 2. Handle task relationships only if task IDs are provided
            if (selectedTaskIds !== undefined && currentTaskIds !== undefined) {
                const tasksToRemove = currentTaskIds.filter((id) => !selectedTaskIds.includes(id));
                const tasksToAdd = selectedTaskIds.filter((id) => !currentTaskIds.includes(id));
                // Remove task-goal relationships for unselected tasks
                if (tasksToRemove.length > 0) {
                    await (0, unlinkTasksFromGoal_1.unlinkTasksFromGoal)(goalId, tasksToRemove, tx);
                }
                // Add selected existing tasks to goal
                if (tasksToAdd.length > 0) {
                    await (0, linkTasksToGoal_1.linkExistingTasksToGoal)(userId, tasksToAdd, goalId, tx);
                }
            }
            // 3. Create new tasks if any
            if (newTasks && newTasks.length > 0) {
                const createdTasks = await (0, insertTasksForGoal_1.insertTasksForGoal)(userId, newTasks, tx);
                // Link new tasks to goal
                if (createdTasks.length > 0) {
                    await (0, linkTasksToGoal_1.linkNewTasksToGoal)(createdTasks.map((task) => task.id), goalId, tx);
                }
            }
            return goal;
        });
    }
    else {
        // Simple update without tasks
        return await (0, updateGoalHelper_1.updateGoalRecord)(userId, goalId, data, db);
    }
}

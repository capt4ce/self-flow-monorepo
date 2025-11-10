"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskWithSubtasks = createTaskWithSubtasks;
const insertTask_1 = require("../task/insertTask");
const insertSubtasksForTask_1 = require("../task/insertSubtasksForTask");
const linkTaskToGoal_1 = require("../task/linkTaskToGoal");
const linkTasksToGoal_1 = require("../goal/linkTasksToGoal");
const linkExistingTasksAsSubtasks_1 = require("../task/linkExistingTasksAsSubtasks");
/**
 * Creates a task with optional subtasks and goal linking.
 * This is the core logic shared by createTask and createTaskForDate.
 *
 * @param userId - The ID of the user creating the task
 * @param taskData - The task data (including optional subtasks, but without goalId)
 * @param tx - The database transaction to use
 * @param goalId - Optional goal ID to link the task and subtasks to
 * @returns The created task
 */
async function createTaskWithSubtasks(userId, taskData, executor, goalId) {
    // Extract subtasks data before passing to insertTask
    const { newSubtasks, existingSubtaskIds, ...taskDataWithoutSubtasks } = taskData;
    // 1. Create the main task
    const task = await (0, insertTask_1.insertTask)(userId, taskDataWithoutSubtasks, executor);
    const taskId = task.id;
    // 2. Link task to goal if goalId provided
    if (goalId) {
        await (0, linkTaskToGoal_1.linkTaskToGoal)(taskId, goalId, executor);
    }
    // 3. Handle subtasks if any
    const hasSubtasks = (newSubtasks && newSubtasks.length > 0) ||
        (existingSubtaskIds && existingSubtaskIds.length > 0);
    if (hasSubtasks) {
        // Create new subtasks if any
        if (newSubtasks && newSubtasks.length > 0) {
            const createdSubtasks = await (0, insertSubtasksForTask_1.insertSubtasksForTask)(userId, taskId, newSubtasks, executor);
            // Link subtasks to goal if goalId provided
            if (goalId && createdSubtasks.length > 0) {
                await (0, linkTasksToGoal_1.linkNewTasksToGoal)(createdSubtasks.map((subtask) => subtask.id), goalId, executor);
            }
        }
        // Update existing tasks to set them as subtasks
        if (existingSubtaskIds && existingSubtaskIds.length > 0) {
            await (0, linkExistingTasksAsSubtasks_1.linkExistingTasksAsSubtasks)(userId, taskId, existingSubtaskIds, executor);
        }
    }
    return task;
}

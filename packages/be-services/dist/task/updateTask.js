"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTask = updateTask;
const db_1 = require("@self-flow/db");
const updateTaskRecord_1 = require("./updateTaskRecord");
const insertSubtasksForTask_1 = require("./insertSubtasksForTask");
const unlinkSubtasksFromTask_1 = require("./unlinkSubtasksFromTask");
const linkExistingTasksAsSubtasks_1 = require("./linkExistingTasksAsSubtasks");
async function updateTask(userId, taskId, data) {
    const db = (0, db_1.getDb)();
    // Check if we need to handle subtasks (batch operation)
    const hasSubtasks = (data.newSubtasks && data.newSubtasks.length > 0) ||
        (data.selectedSubtaskIds && data.currentSubtaskIds) ||
        (data.selectedSubtaskIds &&
            data.selectedSubtaskIds.length > 0 &&
            data.currentSubtaskIds &&
            data.currentSubtaskIds.length > 0);
    if (hasSubtasks) {
        // Use transaction for batch operation
        return await db.transaction(async (tx) => {
            // 1. Update the main task
            const task = await (0, updateTaskRecord_1.updateTaskRecord)(userId, taskId, data, tx);
            // 2. Handle subtask relationships
            const currentSubtaskIds = data.currentSubtaskIds || [];
            const selectedSubtaskIds = data.selectedSubtaskIds || [];
            // Subtasks to remove (unselected)
            const subtasksToRemove = currentSubtaskIds.filter((id) => !selectedSubtaskIds.includes(id));
            // Subtasks to add (newly selected)
            const subtasksToAdd = selectedSubtaskIds.filter((id) => !currentSubtaskIds.includes(id));
            // 3. Remove subtask relationships (set parentId to null)
            if (subtasksToRemove.length > 0) {
                await (0, unlinkSubtasksFromTask_1.unlinkSubtasksFromTask)(userId, taskId, subtasksToRemove, tx);
            }
            // 4. Create new subtasks if any
            if (data.newSubtasks && data.newSubtasks.length > 0) {
                await (0, insertSubtasksForTask_1.insertSubtasksForTask)(userId, taskId, data.newSubtasks, tx);
            }
            // 5. Add selected existing tasks as subtasks
            if (subtasksToAdd.length > 0) {
                await (0, linkExistingTasksAsSubtasks_1.linkExistingTasksAsSubtasks)(userId, taskId, subtasksToAdd, tx);
            }
            return task;
        });
    }
    else {
        // Simple update without subtasks
        return await (0, updateTaskRecord_1.updateTaskRecord)(userId, taskId, data, undefined);
    }
}

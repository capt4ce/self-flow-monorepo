import { getDb } from "@self-flow/db";
import { UpdateTaskDTO, TaskDTO } from "@self-flow/common/types";
import { CreateTaskDTO } from "@self-flow/common/types";
import { updateTaskRecord } from "./updateTaskRecord";
import { insertSubtasksForTask } from "./insertSubtasksForTask";
import { unlinkSubtasksFromTask } from "./unlinkSubtasksFromTask";
import { linkExistingTasksAsSubtasks } from "./linkExistingTasksAsSubtasks";

interface UpdateTaskWithSubtasksDTO extends UpdateTaskDTO {
  newSubtasks?: Array<Omit<CreateTaskDTO, "parentId">>;
  selectedSubtaskIds?: string[];
  currentSubtaskIds?: string[];
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: UpdateTaskWithSubtasksDTO
): Promise<TaskDTO> {
  const db = getDb();

  // Check if we need to handle subtasks (batch operation)
  const hasSubtasks =
    (data.newSubtasks && data.newSubtasks.length > 0) ||
    (data.selectedSubtaskIds && data.currentSubtaskIds) ||
    (data.selectedSubtaskIds &&
      data.selectedSubtaskIds.length > 0 &&
      data.currentSubtaskIds &&
      data.currentSubtaskIds.length > 0);

  if (hasSubtasks) {
    // Use transaction for batch operation
    return await db.transaction(async (tx) => {
      // 1. Update the main task
      const task = await updateTaskRecord(userId, taskId, data, tx);

      // 2. Handle subtask relationships
      const currentSubtaskIds = data.currentSubtaskIds || [];
      const selectedSubtaskIds = data.selectedSubtaskIds || [];

      // Subtasks to remove (unselected)
      const subtasksToRemove = currentSubtaskIds.filter(
        (id) => !selectedSubtaskIds.includes(id)
      );

      // Subtasks to add (newly selected)
      const subtasksToAdd = selectedSubtaskIds.filter(
        (id) => !currentSubtaskIds.includes(id)
      );

      // 3. Remove subtask relationships (set parentId to null)
      if (subtasksToRemove.length > 0) {
        await unlinkSubtasksFromTask(userId, taskId, subtasksToRemove, tx);
      }

      // 4. Create new subtasks if any
      if (data.newSubtasks && data.newSubtasks.length > 0) {
        await insertSubtasksForTask(userId, taskId, data.newSubtasks, tx);
      }

      // 5. Add selected existing tasks as subtasks
      if (subtasksToAdd.length > 0) {
        await linkExistingTasksAsSubtasks(userId, taskId, subtasksToAdd, tx);
      }

      return task;
    });
  } else {
    // Simple update without subtasks
    return await updateTaskRecord(userId, taskId, data, undefined);
  }
}



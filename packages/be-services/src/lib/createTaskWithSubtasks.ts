import { CreateTaskDTO, TaskDTO } from "@self-flow/common/types";
import { insertTask } from "../task/insertTask";
import { insertSubtasksForTask } from "../task/insertSubtasksForTask";
import { linkTaskToGoal } from "../task/linkTaskToGoal";
import { linkNewTasksToGoal } from "../goal/linkTasksToGoal";
import { linkExistingTasksAsSubtasks } from "../task/linkExistingTasksAsSubtasks";
import type { Executor } from "../db/executor";

export interface CreateTaskWithSubtasksDTO extends CreateTaskDTO {
  newSubtasks?: Array<Omit<CreateTaskDTO, "parentId">>;
  existingSubtaskIds?: string[];
}

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
export async function createTaskWithSubtasks(
  userId: string,
  taskData: Omit<CreateTaskWithSubtasksDTO, "goalId">,
  executor: Executor,
  goalId?: string
): Promise<TaskDTO> {
  // Extract subtasks data before passing to insertTask
  const { newSubtasks, existingSubtaskIds, ...taskDataWithoutSubtasks } = taskData;

  // 1. Create the main task
  const task = await insertTask(userId, taskDataWithoutSubtasks, executor);
  const taskId = task.id;

  // 2. Link task to goal if goalId provided
  if (goalId) {
    await linkTaskToGoal(taskId, goalId, executor);
  }

  // 3. Handle subtasks if any
  const hasSubtasks =
    (newSubtasks && newSubtasks.length > 0) ||
    (existingSubtaskIds && existingSubtaskIds.length > 0);

  if (hasSubtasks) {
    // Create new subtasks if any
    if (newSubtasks && newSubtasks.length > 0) {
      const createdSubtasks = await insertSubtasksForTask(
        userId,
        taskId,
        newSubtasks,
        executor
      );

      // Link subtasks to goal if goalId provided
      if (goalId && createdSubtasks.length > 0) {
        await linkNewTasksToGoal(
          createdSubtasks.map((subtask) => subtask.id),
          goalId,
          executor
        );
      }
    }

    // Update existing tasks to set them as subtasks
    if (existingSubtaskIds && existingSubtaskIds.length > 0) {
      await linkExistingTasksAsSubtasks(
        userId,
        taskId,
        existingSubtaskIds,
        executor
      );
    }
  }

  return task;
}


import { getDb } from "@self-flow/db";
import { CreateTaskDTO, TaskDTO } from "@self-flow/common/types";
import { insertTask } from "./insertTask";
import { insertSubtasksForTask } from "./insertSubtasksForTask";
import { linkTaskToGoal } from "./linkTaskToGoal";
import { linkNewTasksToGoal } from "../goal/linkTasksToGoal";
import { linkExistingTasksAsSubtasks } from "./linkExistingTasksAsSubtasks";

interface CreateTaskWithSubtasksDTO extends CreateTaskDTO {
  newSubtasks?: Array<Omit<CreateTaskDTO, "parentId">>;
  existingSubtaskIds?: string[];
}

export async function createTask(
  userId: string,
  data: CreateTaskWithSubtasksDTO
): Promise<TaskDTO> {
  const db = getDb();

  // Check if we need to handle subtasks (batch operation)
  const hasSubtasks =
    (data.newSubtasks && data.newSubtasks.length > 0) ||
    (data.existingSubtaskIds && data.existingSubtaskIds.length > 0);

  // Handle goalId separately via task_goals if provided
  const goalId = (data as any).goalId;

  if (hasSubtasks) {
    // Use transaction for batch operation
    return await db.transaction(async (tx) => {
      // 1. Create the main task
      const task = await insertTask(userId, data, tx);
      const taskId = task.id;

      // 2. Link task to goal if goalId provided
      if (goalId) {
        await linkTaskToGoal(taskId, goalId, tx);
      }

      // 3. Create new subtasks if any
      if (data.newSubtasks && data.newSubtasks.length > 0) {
        const createdSubtasks = await insertSubtasksForTask(
          userId,
          taskId,
          data.newSubtasks,
          tx
        );

        // Link subtasks to goal if parent task has goalId
        if (goalId && createdSubtasks.length > 0) {
          await linkNewTasksToGoal(
            createdSubtasks.map((subtask) => subtask.id),
            goalId,
            tx
          );
        }
      }

      // 4. Update existing tasks to set them as subtasks
      if (data.existingSubtaskIds && data.existingSubtaskIds.length > 0) {
        await linkExistingTasksAsSubtasks(
          userId,
          taskId,
          data.existingSubtaskIds,
          tx
        );
      }

      return task;
    });
  } else {
    // Simple create without subtasks
    const task = await insertTask(userId, data, undefined);

    // If goalId is provided, create task-goal relationship
    if (goalId) {
      await linkTaskToGoal(task.id, goalId, undefined, db);
    }

    return task;
  }
}



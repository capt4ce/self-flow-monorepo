import { getDb } from "@self-flow/db";
import { TaskDTO } from "@self-flow/common/types";
import { insertTask } from "./insertTask";
import { linkTaskToGoal } from "./linkTaskToGoal";
import {
  CreateTaskWithSubtasksDTO,
  createTaskWithSubtasks,
} from "../lib/createTaskWithSubtasks";

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
      // Remove goalId from data as it's handled separately
      const { goalId: _, ...taskData } = data;
      return await createTaskWithSubtasks(userId, taskData, tx, goalId);
    });
  } else {
    // Simple create without subtasks
    const { goalId: _, ...taskData } = data;
    const task = await insertTask(userId, taskData, undefined);

    // If goalId is provided, create task-goal relationship
    if (goalId) {
      await linkTaskToGoal(task.id, goalId, undefined, db);
    }

    return task;
  }
}

// Re-export the interface for convenience
export type { CreateTaskWithSubtasksDTO };



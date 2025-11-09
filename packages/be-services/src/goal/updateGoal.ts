import { getDb } from "@self-flow/db";
import { UpdateGoalDTO, GoalDTO } from "@self-flow/common/types";
import { CreateTaskDTO } from "@self-flow/common/types";
import { updateGoalRecord } from "./updateGoalHelper";
import { insertTasksForGoal } from "./insertTasksForGoal";
import { linkNewTasksToGoal, linkExistingTasksToGoal } from "./linkTasksToGoal";
import { unlinkTasksFromGoal } from "./unlinkTasksFromGoal";

interface UpdateGoalWithTasksDTO extends UpdateGoalDTO {
  newTasks?: Array<Omit<CreateTaskDTO, "goalId">>;
  selectedTaskIds?: string[];
  currentTaskIds?: string[];
}

export async function updateGoal(
  userId: string,
  goalId: string,
  data: UpdateGoalWithTasksDTO
): Promise<GoalDTO> {
  const db = getDb();

  // Check if we need to handle tasks (batch operation)
  const hasNewTasks = data.newTasks && data.newTasks.length > 0;
  const hasTaskRelationships =
    (data.selectedTaskIds && data.selectedTaskIds.length > 0) ||
    (data.currentTaskIds && data.currentTaskIds.length > 0);
  const hasTasks = hasNewTasks || hasTaskRelationships;

  if (hasTasks) {
    // Use transaction for batch operation
    return await db.transaction(async (tx) => {
      // Extract task-related data before passing to updateGoalRecord
      const { newTasks, selectedTaskIds, currentTaskIds, ...goalUpdateData } =
        data;

      // 1. Update the goal
      const goal = await updateGoalRecord(userId, goalId, goalUpdateData, tx);

      // 2. Handle task relationships only if task IDs are provided
      if (selectedTaskIds !== undefined && currentTaskIds !== undefined) {
        const tasksToRemove = currentTaskIds.filter(
          (id) => !selectedTaskIds.includes(id)
        );

        const tasksToAdd = selectedTaskIds.filter(
          (id) => !currentTaskIds.includes(id)
        );

        // Remove task-goal relationships for unselected tasks
        if (tasksToRemove.length > 0) {
          await unlinkTasksFromGoal(goalId, tasksToRemove, tx);
        }

        // Add selected existing tasks to goal
        if (tasksToAdd.length > 0) {
          await linkExistingTasksToGoal(userId, tasksToAdd, goalId, tx);
        }
      }

      // 3. Create new tasks if any
      if (newTasks && newTasks.length > 0) {
        const createdTasks = await insertTasksForGoal(userId, newTasks, tx);

        // Link new tasks to goal
        if (createdTasks.length > 0) {
          await linkNewTasksToGoal(
            createdTasks.map((task) => task.id),
            goalId,
            tx
          );
        }
      }

      return goal;
    });
  } else {
    // Simple update without tasks
    return await updateGoalRecord(userId, goalId, data, undefined);
  }
}

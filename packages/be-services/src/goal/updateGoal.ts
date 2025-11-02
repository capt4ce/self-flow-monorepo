import { getDb } from "@self-flow/db";
import { UpdateGoalDTO, GoalDTO } from "@self-flow/common/types";
import { CreateTaskDTO } from "@self-flow/common/types";
import { updateGoalRecord } from "./updateGoalHelper";
import { insertTasksForGoal } from "./insertTasksForGoal";
import {
  linkNewTasksToGoal,
  linkExistingTasksToGoal,
} from "./linkTasksToGoal";
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
  const hasTasks =
    (data.newTasks && data.newTasks.length > 0) ||
    (data.selectedTaskIds && data.currentTaskIds) ||
    (data.selectedTaskIds &&
      data.selectedTaskIds.length > 0 &&
      data.currentTaskIds &&
      data.currentTaskIds.length > 0);

  if (hasTasks) {
    // Use transaction for batch operation
    return await db.transaction(async (tx) => {
      // 1. Update the goal
      const goal = await updateGoalRecord(userId, goalId, data, tx);

      // 2. Handle task relationships
      const currentTaskIds = data.currentTaskIds || [];
      const selectedTaskIds = data.selectedTaskIds || [];

      // Tasks to remove from goal (unselected)
      const tasksToRemove = currentTaskIds.filter(
        (id) => !selectedTaskIds.includes(id)
      );

      // Tasks to add to goal (newly selected)
      const tasksToAdd = selectedTaskIds.filter(
        (id) => !currentTaskIds.includes(id)
      );

      // 3. Remove task-goal relationships for unselected tasks
      if (tasksToRemove.length > 0) {
        await unlinkTasksFromGoal(goalId, tasksToRemove, tx);
      }

      // 4. Create new tasks if any
      if (data.newTasks && data.newTasks.length > 0) {
        const createdTasks = await insertTasksForGoal(
          userId,
          data.newTasks,
          tx
        );

        // Link new tasks to goal
        if (createdTasks.length > 0) {
          await linkNewTasksToGoal(
            createdTasks.map((task) => task.id),
            goalId,
            tx
          );
        }
      }

      // 5. Add selected existing tasks to goal
      if (tasksToAdd.length > 0) {
        await linkExistingTasksToGoal(userId, tasksToAdd, goalId, tx);
      }

      return goal;
    });
  } else {
    // Simple update without tasks
    return await updateGoalRecord(userId, goalId, data, undefined);
  }
}
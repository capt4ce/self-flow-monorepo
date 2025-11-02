import { getDb } from "@self-flow/db";
import { CreateGoalDTO, GoalDTO } from "@self-flow/common/types";
import { CreateTaskDTO } from "@self-flow/common/types";
import { insertGoal } from "./insertGoal";
import { insertTasksForGoal } from "./insertTasksForGoal";
import { linkNewTasksToGoal, linkExistingTasksToGoal } from "./linkTasksToGoal";

interface CreateGoalWithTasksDTO extends CreateGoalDTO {
  newTasks?: Array<Omit<CreateTaskDTO, "goalId">>;
  existingTaskIds?: string[];
}

export async function createGoal(
  userId: string,
  data: CreateGoalWithTasksDTO
): Promise<GoalDTO> {
  const db = getDb();

  // Check if we need to handle tasks (batch operation)
  const hasTasks =
    (data.newTasks && data.newTasks.length > 0) ||
    (data.existingTaskIds && data.existingTaskIds.length > 0);

  if (hasTasks) {
    // Use transaction for batch operation
    return await db.transaction(async (tx) => {
      // 1. Create the goal
      const goal = await insertGoal(userId, data, tx);
      const goalId = goal.id;

      // 2. Create new tasks if any
      if (data.newTasks && data.newTasks.length > 0) {
        const createdTasks = await insertTasksForGoal(
          userId,
          data.newTasks,
          tx
        );

        // 3. Link new tasks to goal via task_goals junction table
        if (createdTasks.length > 0) {
          await linkNewTasksToGoal(
            createdTasks.map((task) => task.id),
            goalId,
            tx
          );
        }
      }

      // 4. Link existing tasks to goal if any
      if (data.existingTaskIds && data.existingTaskIds.length > 0) {
        await linkExistingTasksToGoal(userId, data.existingTaskIds, goalId, tx);
      }

      return goal;
    });
  } else {
    // Simple create without tasks
    return await insertGoal(userId, data, undefined);
  }
}

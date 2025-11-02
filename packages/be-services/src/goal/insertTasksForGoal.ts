import { tasks } from "@self-flow/db/src/drizzle/schema";
import { CreateTaskDTO, TaskDTO } from "@self-flow/common/types";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type Transaction = Parameters<Parameters<NeonHttpDatabase["transaction"]>[0]>[0];

interface TaskInsertData {
  userId: string;
  title: string;
  description?: string | null;
  status?: string | null;
  effort?: string | null;
  priority?: string | null;
  completed?: boolean;
  parentId?: string | null;
  groupId?: string | null;
  isTemplate?: boolean;
  templateId?: string | null;
  orderIndex?: number;
}

/**
 * Insert new tasks for a goal
 * @param userId - The ID of the user creating the tasks
 * @param newTasks - Array of task data to create (without goalId)
 * @param tx - Database transaction
 * @returns Array of created tasks
 */
export async function insertTasksForGoal(
  userId: string,
  newTasks: Array<Omit<CreateTaskDTO, "goalId">>,
  tx: Transaction
): Promise<TaskDTO[]> {
  const tasksToCreate = newTasks
    .filter((t) => t.title?.trim())
    .map((task): TaskInsertData => ({
      userId,
      title: task.title!,
      description: task.description || null,
      status: task.status || null,
      effort: task.effort || null,
      priority: task.priority || null,
      completed: task.completed || false,
      parentId: task.parentId || null,
      groupId: task.groupId || null,
      isTemplate: task.isTemplate || false,
      templateId: task.templateId || null,
      orderIndex: task.orderIndex || 0,
    }));

  if (tasksToCreate.length === 0) {
    return [];
  }

  const createdTasks = await tx
    .insert(tasks)
    .values(tasksToCreate)
    .returning();

  return createdTasks as TaskDTO[];
}

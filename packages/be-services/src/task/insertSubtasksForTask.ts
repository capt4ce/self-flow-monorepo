import { tasks } from "@self-flow/db/src/drizzle/schema";
import {
  CreateTaskDTO,
  TaskDTO,
  TaskEffort,
  TaskPriority,
  TaskStatus,
} from "@self-flow/common/types";
import type { Executor } from "../db/executor";

interface SubtaskInsertData {
  userId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus | null;
  effort?: TaskEffort | null;
  priority?: TaskPriority | null;
  completed?: boolean;
  parentId: string;
  groupId?: string | null;
  isTemplate?: boolean;
  templateId?: string | null;
  orderIndex?: number;
}

/**
 * Insert new subtasks for a task
 * @param userId - The ID of the user creating the subtasks
 * @param parentTaskId - The ID of the parent task
 * @param newSubtasks - Array of subtask data to create (without parentId)
 * @param tx - Database transaction
 * @returns Array of created subtasks
 */
export async function insertSubtasksForTask(
  userId: string,
  parentTaskId: string,
  newSubtasks: Array<Omit<CreateTaskDTO, "parentId">>,
  executor: Executor
): Promise<TaskDTO[]> {
  const subtasksToCreate = newSubtasks
    .filter((st) => st.title?.trim())
    .map((subtask): SubtaskInsertData => ({
      userId,
      title: subtask.title!,
      description: subtask.description || null,
      status: subtask.status || null,
      effort: subtask.effort || null,
      priority: subtask.priority || null,
      completed: subtask.completed || false,
      parentId: parentTaskId,
      groupId: subtask.groupId || null,
      isTemplate: subtask.isTemplate || false,
      templateId: subtask.templateId || null,
      orderIndex: subtask.orderIndex || 0,
    }));

  if (subtasksToCreate.length === 0) {
    return [];
  }

  const createdSubtasks = await executor
    .insert(tasks)
    .values(subtasksToCreate)
    .returning();

  return createdSubtasks as TaskDTO[];
}

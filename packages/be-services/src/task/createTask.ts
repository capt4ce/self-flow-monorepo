import { db } from "@self-flow/db";
import { tasks, taskGoals } from "@self-flow/db/src/drizzle/schema";
import { CreateTaskDTO, TaskDTO } from "@self-flow/common/types";

export async function createTask(
  userId: string,
  data: CreateTaskDTO
): Promise<TaskDTO> {
  const [task] = await db
    .insert(tasks)
    .values({
      userId,
      title: data.title,
      description: data.description || null,
      status: data.status || null,
      effort: data.effort || null,
      priority: data.priority || null,
      completed: data.completed || false,
      parentId: data.parentId || null,
      groupId: data.groupId || null,
      isTemplate: data.isTemplate || false,
      templateId: data.templateId || null,
      orderIndex: data.orderIndex || 0,
    })
    .returning();

  // If goalId is provided, create task-goal relationship
  if (data.goalId) {
    await db.insert(taskGoals).values({
      taskId: task.id,
      goalId: data.goalId,
    });
  }

  return task as TaskDTO;
}



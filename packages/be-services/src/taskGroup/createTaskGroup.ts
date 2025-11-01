import { db } from "@self-flow/db";
import { taskGroups } from "@self-flow/db/src/drizzle/schema";
import { CreateTaskGroupDTO, TaskGroupDTO } from "@self-flow/common/types";

export async function createTaskGroup(
  userId: string,
  data: CreateTaskGroupDTO
): Promise<TaskGroupDTO> {
  const [group] = await db
    .insert(taskGroups)
    .values({
      userId,
      title: data.title,
      goalId: data.goalId,
      orderIndex: data.orderIndex || 0,
    })
    .returning();

  return group as TaskGroupDTO;
}



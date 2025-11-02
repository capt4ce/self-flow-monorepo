import { getDb } from "@self-flow/db";
import { taskGroups } from "@self-flow/db/src/drizzle/schema";
import { CreateTaskGroupDTO, TaskGroupDTO } from "@self-flow/common/types";

type Env = {
  DATABASE_URL?: string;
};

export async function createTaskGroup(
  userId: string,
  data: CreateTaskGroupDTO,
  env?: Env
): Promise<TaskGroupDTO> {
  const db = getDb(env);
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



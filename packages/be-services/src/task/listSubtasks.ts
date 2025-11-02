import { getDb } from "@self-flow/db";
import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { TaskDTO } from "@self-flow/common/types";

type Env = {
  DATABASE_URL?: string;
};

export async function listSubtasks(userId: string, parentIds: string[], env?: Env) {
  if (parentIds.length === 0) {
    return {};
  }

  const db = getDb(env);
  const subtasksList = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.parentId, parentIds)
      )
    )
    .orderBy(tasks.orderIndex);

  // Group by parent_id
  const subtaskMap: Record<string, TaskDTO[]> = {};
  subtasksList.forEach((task) => {
    if (task.parentId) {
      if (!subtaskMap[task.parentId]) {
        subtaskMap[task.parentId] = [];
      }
      subtaskMap[task.parentId].push(task as TaskDTO);
    }
  });

  return subtaskMap;
}


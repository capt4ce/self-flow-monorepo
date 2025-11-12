import { getDb } from "@self-flow/db";
import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { TaskDTO } from "@self-flow/common/types";

export async function listSubtasks(userId: string, parentIds: string[]) {
  if (parentIds.length === 0) {
    return {};
  }

  const db = getDb();
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

  const childParentIds = subtasksList.map((task) => task.id);

  const grandchildRows =
    childParentIds.length > 0
      ? await db
          .select({
            parentId: tasks.parentId,
          })
          .from(tasks)
          .where(
            and(eq(tasks.userId, userId), inArray(tasks.parentId, childParentIds))
          )
      : [];

  const subtaskCountMap = new Map<string, number>();
  for (const row of grandchildRows) {
    if (!row.parentId) continue;
    subtaskCountMap.set(
      row.parentId,
      (subtaskCountMap.get(row.parentId) ?? 0) + 1
    );
  }

  // Group by parent_id
  const subtaskMap: Record<string, TaskDTO[]> = {};
  subtasksList.forEach((task) => {
    if (task.parentId) {
      if (!subtaskMap[task.parentId]) {
        subtaskMap[task.parentId] = [];
      }
      subtaskMap[task.parentId].push({
        ...(task as TaskDTO),
        subtaskCount: subtaskCountMap.get(task.id) ?? 0,
        subtasks: [],
      });
    }
  });

  return subtaskMap;
}


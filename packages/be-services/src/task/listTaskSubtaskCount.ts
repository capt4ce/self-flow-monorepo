import { getDb } from "@self-flow/db";
import { tasks } from "@self-flow/db/src/drizzle/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

type Env = {
  DATABASE_URL?: string;
};

export async function listTaskSubtaskCount(parentIds: string[], env?: Env) {
  if (parentIds.length === 0) {
    return [];
  }

  const db = getDb(env);
  const counts = await db
    .select({
      parentId: tasks.parentId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(tasks)
    .where(inArray(tasks.parentId, parentIds))
    .groupBy(tasks.parentId);

  return counts.map((c) => ({
    parent_id: c.parentId!,
    subtaskCount: Number(c.count),
  }));
}



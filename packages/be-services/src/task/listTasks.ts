import { getDb } from "@self-flow/db";
import { goals, taskGoals, tasks } from "@self-flow/db/src/drizzle/schema";
import {
  TaskDTO,
  TaskFilterCondition,
  TaskFilterDefinition,
  TaskFilterField,
  TaskQuery,
  TaskSortOption,
} from "@self-flow/common/types";
import {
  SQL,
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  ne,
  not,
  or,
  sql,
} from "drizzle-orm";

type TaskQueryOptions = TaskQuery;

type NormalizedFilter = {
  field: TaskFilterField;
  condition: TaskFilterCondition;
};

const sortableFieldToColumn: Partial<Record<TaskFilterField, any>> = {
  orderIndex: tasks.orderIndex,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  title: tasks.title,
  priority: tasks.priority,
  effort: tasks.effort,
  status: tasks.status,
};

const scalarFieldToColumn: Partial<Record<TaskFilterField, any>> = {
  id: tasks.id,
  status: tasks.status,
  completed: tasks.completed,
  orderIndex: tasks.orderIndex,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  effort: tasks.effort,
  priority: tasks.priority,
  groupId: tasks.groupId,
  parentId: tasks.parentId,
  assigneeId: tasks.assigneeId,
  isTemplate: tasks.isTemplate,
  templateId: tasks.templateId,
  title: tasks.title,
  description: tasks.description,
};

function normalizeFilters(
  filters?: TaskFilterDefinition[] | null
): NormalizedFilter[] {
  if (!filters) return [];
  const normalized: NormalizedFilter[] = [];

  for (const filter of filters) {
    if (!filter) continue;
    if ("field" in filter) {
      if (filter.conditions) {
        normalized.push({
          field: filter.field,
          condition: filter.conditions,
        });
      }
    } else {
      const entries = Object.entries(filter) as Array<
        [TaskFilterField, TaskFilterCondition]
      >;
      for (const [field, condition] of entries) {
        if (condition) {
          normalized.push({ field, condition });
        }
      }
    }
  }

  return normalized;
}

function addScalarConditions(
  column: any,
  condition: TaskFilterCondition,
  clauses: SQL<unknown>[]
) {
  if (!column) return;

  if (condition.eq !== undefined) {
    if (condition.eq === null) {
      clauses.push(sql`${column} IS NULL`);
    } else {
      clauses.push(eq(column, condition.eq as any));
    }
  }

  if (condition.neq !== undefined) {
    if (condition.neq === null) {
      clauses.push(sql`${column} IS NOT NULL`);
    } else {
      clauses.push(ne(column, condition.neq as any));
    }
  }

  if (condition.in && condition.in.length > 0) {
    const values = condition.in.filter(
      (value) => value !== undefined && value !== null
    );
    if (values.length > 0) {
      clauses.push(inArray(column, values as any[]));
    }
  }

  if (condition.nin && condition.nin.length > 0) {
    const values = condition.nin.filter(
      (value) => value !== undefined && value !== null
    );
    if (values.length > 0) {
      clauses.push(not(inArray(column, values as any[])));
    }
  }

  if (condition.is !== undefined) {
    clauses.push(
      condition.is ? sql`${column} IS TRUE` : sql`${column} IS FALSE`
    );
  }
}

function addRangeConditions(
  column: any,
  condition: TaskFilterCondition,
  clauses: SQL<unknown>[]
) {
  if (!column) return;

  if (condition.gt !== undefined && condition.gt !== null) {
    clauses.push(gt(column, condition.gt as any));
  }
  if (condition.gte !== undefined && condition.gte !== null) {
    clauses.push(gte(column, condition.gte as any));
  }
  if (condition.lt !== undefined && condition.lt !== null) {
    clauses.push(lt(column, condition.lt as any));
  }
  if (condition.lte !== undefined && condition.lte !== null) {
    clauses.push(lte(column, condition.lte as any));
  }
}

function addContainsCondition(
  column: any,
  condition: TaskFilterCondition,
  clauses: SQL<unknown>[]
) {
  if (!column || !condition.contains) return;

  const value = `%${condition.contains.toLowerCase()}%`;
  clauses.push(sql`LOWER(${column}) LIKE ${value}`);
}

function addGoalConditions(
  condition: TaskFilterCondition,
  clauses: SQL<unknown>[]
) {
  const eqValues: string[] = [];
  const neqValues: string[] = [];

  if (typeof condition.eq === "string") {
    eqValues.push(condition.eq);
  }
  if (condition.in) {
    eqValues.push(
      ...condition.in.filter(
        (value): value is string => typeof value === "string"
      )
    );
  }
  if (typeof condition.neq === "string") {
    neqValues.push(condition.neq);
  }
  if (condition.nin) {
    neqValues.push(
      ...condition.nin.filter(
        (value): value is string => typeof value === "string"
      )
    );
  }

  if (eqValues.length > 0) {
    const goalExistsClauses = eqValues.map(
      (goalId) =>
        sql<boolean>`EXISTS (
        SELECT 1
        FROM ${taskGoals} tg
        WHERE tg.task_id = ${tasks.id}
          AND tg.goal_id = ${goalId}
      )`
    );

    if (goalExistsClauses.length === 1) {
      clauses.push(goalExistsClauses[0]!);
    } else {
      const castClauses = goalExistsClauses.map(
        (clause) => clause as SQL<unknown>
      );
      const [firstClause, ...restClauses] = castClauses as [
        SQL<unknown>,
        ...SQL<unknown>[],
      ];
      const combined = restClauses.reduce<SQL<unknown>>(
        (acc, clause) => or(acc, clause) as SQL<unknown>,
        firstClause
      );
      clauses.push(combined);
    }
  }

  if (neqValues.length > 0) {
    const goalNotExistsClauses = neqValues.map(
      (goalId) =>
        sql<boolean>`NOT EXISTS (
        SELECT 1
        FROM ${taskGoals} tg
        WHERE tg.task_id = ${tasks.id}
          AND tg.goal_id = ${goalId}
      )`
    );

    if (goalNotExistsClauses.length === 1) {
      clauses.push(goalNotExistsClauses[0]!);
    } else {
      const castClauses = goalNotExistsClauses.map(
        (clause) => clause as SQL<unknown>
      );
      const [firstClause, ...restClauses] = castClauses as [
        SQL<unknown>,
        ...SQL<unknown>[],
      ];
      const combined = restClauses.reduce<SQL<unknown>>(
        (acc, clause) => and(acc, clause) as SQL<unknown>,
        firstClause
      );
      clauses.push(combined);
    }
  }

  if (condition.eq === null || condition.is === false) {
    clauses.push(
      sql<boolean>`NOT EXISTS (
        SELECT 1
        FROM ${taskGoals} tg
        WHERE tg.task_id = ${tasks.id}
      )`
    );
  }

  if (condition.is === true) {
    clauses.push(
      sql<boolean>`EXISTS (
        SELECT 1
        FROM ${taskGoals} tg
        WHERE tg.task_id = ${tasks.id}
      )`
    );
  }
}

function buildSortClauses(sort?: TaskSortOption[]): SQL<unknown>[] {
  if (!sort) return [];
  const clauses: SQL<unknown>[] = [];

  for (const option of sort) {
    if (!option) continue;
    const column = sortableFieldToColumn[option.field];
    if (!column) continue;

    clauses.push(option.direction === "desc" ? desc(column) : asc(column));
  }

  return clauses;
}

export async function listTasks(userId: string, params: TaskQueryOptions = {}) {
  const db = getDb();
  const { limit = 20, offset = 0, filters, search, sort } = params ?? {};

  const whereClauses: SQL<unknown>[] = [eq(tasks.userId, userId)];

  const normalizedFilters = normalizeFilters(filters);

  for (const { field, condition } of normalizedFilters) {
    if (field === "goalId") {
      addGoalConditions(condition, whereClauses);
      continue;
    }

    const column = scalarFieldToColumn[field];
    if (!column) continue;

    addScalarConditions(column, condition, whereClauses);
    addRangeConditions(column, condition, whereClauses);
    addContainsCondition(column, condition, whereClauses);
  }

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    const terms = trimmedSearch.split(/\s+/).filter(Boolean);
    if (terms.length > 0) {
      const perTermClauses = terms.map((term) => {
        const value = `%${term.toLowerCase()}%`;
        return or(
          sql<boolean>`LOWER(${tasks.title}) LIKE ${value}`,
          sql<boolean>`LOWER(${tasks.description}) LIKE ${value}`
        );
      }) as SQL<unknown>[];

      if (perTermClauses.length === 1) {
        whereClauses.push(perTermClauses[0]!);
      } else {
        const [firstClause, ...restClauses] = perTermClauses as [
          SQL<unknown>,
          ...SQL<unknown>[],
        ];
        const combined = restClauses.reduce<SQL<unknown>>(
          (acc, clause) => and(acc, clause) as SQL<unknown>,
          firstClause
        );
        whereClauses.push(combined);
      }
    }
  }

  let whereCondition: SQL<unknown> | undefined;
  for (const clause of whereClauses) {
    if (!clause) continue;
    whereCondition = whereCondition ? and(whereCondition, clause) : clause;
  }

  const orderByClauses = buildSortClauses(sort);
  const finalOrderBy =
    orderByClauses.length > 0
      ? orderByClauses
      : [asc(tasks.orderIndex), asc(tasks.createdAt)];

  let query = db.select().from(tasks);

  if (whereCondition) {
    query = query.where(whereCondition as any) as typeof query;
  }

  // Apply ordering
  query = query.orderBy(
    ...(finalOrderBy as [SQL<unknown>, ...SQL<unknown>[]])
  ) as typeof query;

  if (limit !== undefined) {
    query = query.limit(limit) as typeof query;
  }

  if (offset) {
    query = query.offset(offset) as typeof query;
  }

  const tasksList = await query;

  const taskIds = tasksList.map((t) => t.id);

  const subtaskRows =
    taskIds.length > 0
      ? await db
          .select()
          .from(tasks)
          .where(
            and(eq(tasks.userId, userId), inArray(tasks.parentId, taskIds))
          )
          .orderBy(tasks.parentId, tasks.orderIndex)
      : [];

  const subtaskIds = subtaskRows.map((task) => task.id);

  const grandchildRows =
    subtaskIds.length > 0
      ? await db
          .select({
            parentId: tasks.parentId,
          })
          .from(tasks)
          .where(
            and(eq(tasks.userId, userId), inArray(tasks.parentId, subtaskIds))
          )
      : [];

  const grandchildCountMap = new Map<string, number>();
  for (const row of grandchildRows) {
    if (!row.parentId) continue;
    grandchildCountMap.set(
      row.parentId,
      (grandchildCountMap.get(row.parentId) ?? 0) + 1
    );
  }

  type TaskSelect = typeof tasks.$inferSelect;
  const subtasksByParent = new Map<string, TaskSelect[]>();
  for (const subtask of subtaskRows) {
    if (!subtask.parentId) {
      continue;
    }
    const existing = subtasksByParent.get(subtask.parentId);
    if (existing) {
      existing.push(subtask);
    } else {
      subtasksByParent.set(subtask.parentId, [subtask]);
    }
  }

  const taskGoalRelations =
    taskIds.length > 0
      ? await db
          .select()
          .from(taskGoals)
          .where(inArray(taskGoals.taskId, taskIds))
      : [];

  const goalIds = [...new Set(taskGoalRelations.map((tg) => tg.goalId))];
  const goalsList =
    goalIds.length > 0
      ? await db.select().from(goals).where(inArray(goals.id, goalIds))
      : [];

  const goalMap = new Map<string, (typeof goalsList)[number]>();
  goalsList.forEach((goal) => goalMap.set(goal.id, goal));

  const taskGoalMap = new Map<string, (typeof taskGoalRelations)[number]>();
  taskGoalRelations.forEach((tg) => taskGoalMap.set(tg.taskId, tg));

  const tasksWithGoals = tasksList.map((task) => {
    const tg = taskGoalMap.get(task.id);
    const goal = tg ? goalMap.get(tg.goalId) : null;
    const subtasks = (subtasksByParent.get(task.id) ?? []).map((subtask) => ({
      ...subtask,
      goal_id: goal?.id ?? null,
      subtaskCount: grandchildCountMap.get(subtask.id) ?? 0,
      subtasks: [],
    }));

    return {
      ...task,
      goalTitle: goal?.title ?? "",
      goalId: goal?.id ?? null,
      goal_id: goal?.id ?? null,
      subtaskCount: subtasks.length,
      subtasks,
    };
  });

  return tasksWithGoals as TaskDTO[];
}

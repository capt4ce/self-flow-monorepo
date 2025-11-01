import {
  pgTable,
  foreignKey,
  pgPolicy,
  uuid,
  text,
  timestamp,
  index,
  check,
  date,
  integer,
  boolean,
  bigint,
  varchar,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const goalStatus = pgEnum("Goal status", ["active", "done"]);
export const taskEffort = pgEnum("Task effort", ["low", "med", "high"]);
export const taskPriority = pgEnum("Task priority", ["low", "med", "high"]);
export const taskStatus = pgEnum("Task status", [
  "todo",
  "in progress",
  "blocked",
  "completed",
  "not done",
]);

// Reference table for auth.users (external schema, not managed by this ORM)
// This is a type-only reference for foreign key relationships
// Note: The actual table exists in the 'auth' schema, but Drizzle needs a local reference
// Using a different table name to avoid conflicts with public.users
export const usersInAuth = pgTable("auth_users_ref", {
  id: uuid().primaryKey().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().notNull(),
    email: text(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [usersInAuth.id],
      name: "users_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can update own profile", {
      as: "permissive",
      for: "update",
      to: ["public"],
      using: sql`(auth.uid() = id)`,
    }),
    pgPolicy("Users can view own profile", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
  ]
);

export const goals = pgTable(
  "goals",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    title: text().notNull(),
    description: text(),
    category: text().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    status: goalStatus().default("active").notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
  },
  (table) => [
    index("idx_goals_category").using(
      "btree",
      table.category.asc().nullsLast().op("text_ops")
    ),
    index("idx_goals_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "goals_user_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can delete own goals", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy("Users can insert own goals", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("Users can update own goals", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
    pgPolicy("Users can view own goals", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    check(
      "goals_category_check",
      sql`category = ANY (ARRAY['Main'::text, 'Yearly'::text, 'Quarterly'::text, 'Monthly'::text, 'Weekly'::text, 'Daily'::text])`
    ),
  ]
);

export const energyReadings = pgTable(
  "energy_readings",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    level: integer().notNull(),
    note: text(),
    timestamp: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("idx_energy_readings_timestamp").using(
      "btree",
      table.timestamp.asc().nullsLast().op("timestamptz_ops")
    ),
    index("idx_energy_readings_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "energy_readings_user_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can delete own energy readings", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy("Users can insert own energy readings", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("Users can update own energy readings", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
    pgPolicy("Users can view own energy readings", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    check("energy_readings_level_check", sql`(level >= 1) AND (level <= 10)`),
  ]
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    parentId: uuid("parent_id"),
    title: text().notNull(),
    description: text(),
    completed: boolean().default(false),
    orderIndex: integer("order_index").default(0),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    status: taskStatus().default("todo"),
    effort: taskEffort(),
    groupId: uuid("group_id"),
    isTemplate: boolean().default(false).notNull(),
    templateId: uuid(),
    priority: taskPriority(),
    assigneeId: uuid("assignee_id"),
  },
  (table) => [
    index("idx_tasks_group_id").using(
      "btree",
      table.groupId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_tasks_parent_id").using(
      "btree",
      table.parentId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_tasks_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.assigneeId],
      foreignColumns: [usersInAuth.id],
      name: "tasks_assignee_id_fkey",
    }),
    foreignKey({
      columns: [table.assigneeId],
      foreignColumns: [users.id],
      name: "tasks_assignee_id_fkey1",
    }),
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [taskGroups.id],
      name: "tasks_group_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "tasks_parent_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.templateId],
      foreignColumns: [table.id],
      name: "tasks_templateId_fkey",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "tasks_user_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can delete own tasks", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy("Users can insert own tasks", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("Users can update own tasks", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
    pgPolicy("Users can view own tasks", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
  ]
);

export const system = pgTable(
  "system",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "system_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1,
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    creatorId: uuid("creator_id"),
    name: varchar().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.creatorId],
      foreignColumns: [usersInAuth.id],
      name: "system_creator_id_fkey",
    }),
  ]
);

export const assignHistory = pgTable(
  "assign_history",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "assign_history_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1,
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    purpose: varchar(),
    instruction: text(),
    assignorId: uuid("assignor_id").defaultRandom(),
    taskId: uuid("task_id").notNull(),
    assigneeId: uuid("assignee_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.assigneeId],
      foreignColumns: [users.id],
      name: "assign_history_assignee_id_fkey",
    }),
    foreignKey({
      columns: [table.assignorId],
      foreignColumns: [users.id],
      name: "assign_history_assignor_id_fkey",
    }),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "assign_history_task_id_fkey",
    }),
  ]
);

export const taskGoals = pgTable(
  "task_goals",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    taskId: uuid("task_id").notNull(),
    goalId: uuid("goal_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("idx_task_goals_goal_id").using(
      "btree",
      table.goalId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_task_goals_task_id").using(
      "btree",
      table.taskId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.goalId],
      foreignColumns: [goals.id],
      name: "task_goals_goal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "task_goals_task_id_fkey",
    }).onDelete("cascade"),
    unique("task_goals_task_id_goal_id_key").on(table.taskId, table.goalId),
    pgPolicy("Users can manage their own task-goal relationships", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(EXISTS ( SELECT 1
   FROM tasks
  WHERE ((tasks.id = task_goals.task_id) AND (tasks.user_id = auth.uid()))))`,
    }),
  ]
);

export const systemUsers = pgTable(
  "system_users",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "system_users_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      cache: 1,
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    systemId: bigint("system_id", { mode: "number" }),
    userId: uuid("user_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.systemId],
      foreignColumns: [system.id],
      name: "system_users_system_id_fkey",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "system_users_user_id_fkey",
    }),
  ]
);

export const taskGroups = pgTable(
  "task_groups",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    goalId: uuid("goal_id").notNull(),
    userId: uuid("user_id").notNull(),
    orderIndex: integer("order_index").default(0),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("idx_task_groups_goal_id").using(
      "btree",
      table.goalId.asc().nullsLast().op("uuid_ops")
    ),
    index("idx_task_groups_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.goalId],
      foreignColumns: [goals.id],
      name: "task_groups_goal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [usersInAuth.id],
      name: "task_groups_user_id_fkey",
    }).onDelete("cascade"),
  ]
);

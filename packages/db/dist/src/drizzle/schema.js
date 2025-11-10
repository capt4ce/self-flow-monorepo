"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskGroups = exports.systemUsers = exports.taskGoals = exports.assignHistory = exports.system = exports.tasks = exports.energyReadings = exports.goals = exports.users = exports.usersInAuth = exports.taskStatus = exports.taskPriority = exports.taskEffort = exports.goalStatus = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.goalStatus = (0, pg_core_1.pgEnum)("Goal status", ["active", "done"]);
exports.taskEffort = (0, pg_core_1.pgEnum)("Task effort", ["low", "med", "high"]);
exports.taskPriority = (0, pg_core_1.pgEnum)("Task priority", ["low", "med", "high"]);
exports.taskStatus = (0, pg_core_1.pgEnum)("Task status", [
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
exports.usersInAuth = (0, pg_core_1.pgTable)("auth_users_ref", {
    id: (0, pg_core_1.uuid)().primaryKey().notNull(),
});
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)().primaryKey().notNull(),
    email: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
        withTimezone: true,
        mode: "string",
    }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", {
        withTimezone: true,
        mode: "string",
    }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.id],
        foreignColumns: [exports.usersInAuth.id],
        name: "users_id_fkey",
    }).onDelete("cascade"),
    (0, pg_core_1.pgPolicy)("Users can update own profile", {
        as: "permissive",
        for: "update",
        to: ["public"],
        using: (0, drizzle_orm_1.sql) `(auth.uid() = id)`,
    }),
    (0, pg_core_1.pgPolicy)("Users can view own profile", {
        as: "permissive",
        for: "select",
        to: ["public"],
    }),
]);
exports.goals = (0, pg_core_1.pgTable)("goals", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey().notNull(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    title: (0, pg_core_1.text)().notNull(),
    description: (0, pg_core_1.text)(),
    category: (0, pg_core_1.text)().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
        withTimezone: true,
        mode: "string",
    }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", {
        withTimezone: true,
        mode: "string",
    }).defaultNow(),
    status: (0, exports.goalStatus)().default("active").notNull(),
    startDate: (0, pg_core_1.date)("start_date"),
    endDate: (0, pg_core_1.date)("end_date"),
}, (table) => [
    (0, pg_core_1.index)("idx_goals_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("idx_goals_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
    (0, pg_core_1.pgPolicy)("Users can delete own goals", {
        as: "permissive",
        for: "delete",
        to: ["public"],
        using: (0, drizzle_orm_1.sql) `(auth.uid() = user_id)`,
    }),
    (0, pg_core_1.pgPolicy)("Users can insert own goals", {
        as: "permissive",
        for: "insert",
        to: ["public"],
    }),
    (0, pg_core_1.pgPolicy)("Users can update own goals", {
        as: "permissive",
        for: "update",
        to: ["public"],
    }),
    (0, pg_core_1.pgPolicy)("Users can view own goals", {
        as: "permissive",
        for: "select",
        to: ["public"],
    }),
    (0, pg_core_1.check)("goals_category_check", (0, drizzle_orm_1.sql) `category = ANY (ARRAY['Main'::text, 'Yearly'::text, 'Quarterly'::text, 'Monthly'::text, 'Weekly'::text, 'Daily'::text])`),
]);
exports.energyReadings = (0, pg_core_1.pgTable)("energy_readings", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey().notNull(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    level: (0, pg_core_1.integer)().notNull(),
    note: (0, pg_core_1.text)(),
    timestamp: (0, pg_core_1.timestamp)({ withTimezone: true, mode: "string" }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
        withTimezone: true,
        mode: "string",
    }).defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_energy_readings_timestamp").using("btree", table.timestamp.asc().nullsLast().op("timestamptz_ops")),
    (0, pg_core_1.index)("idx_energy_readings_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.userId],
        foreignColumns: [exports.users.id],
        name: "energy_readings_user_id_fkey",
    }).onDelete("cascade"),
    (0, pg_core_1.pgPolicy)("Users can delete own energy readings", {
        as: "permissive",
        for: "delete",
        to: ["public"],
        using: (0, drizzle_orm_1.sql) `(auth.uid() = user_id)`,
    }),
    (0, pg_core_1.pgPolicy)("Users can insert own energy readings", {
        as: "permissive",
        for: "insert",
        to: ["public"],
    }),
    (0, pg_core_1.pgPolicy)("Users can update own energy readings", {
        as: "permissive",
        for: "update",
        to: ["public"],
    }),
    (0, pg_core_1.pgPolicy)("Users can view own energy readings", {
        as: "permissive",
        for: "select",
        to: ["public"],
    }),
    (0, pg_core_1.check)("energy_readings_level_check", (0, drizzle_orm_1.sql) `(level >= 1) AND (level <= 10)`),
]);
exports.tasks = (0, pg_core_1.pgTable)("tasks", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey().notNull(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    parentId: (0, pg_core_1.uuid)("parent_id"),
    title: (0, pg_core_1.text)().notNull(),
    description: (0, pg_core_1.text)(),
    completed: (0, pg_core_1.boolean)().default(false),
    orderIndex: (0, pg_core_1.integer)("order_index").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
        withTimezone: true,
        mode: "string",
    }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", {
        withTimezone: true,
        mode: "string",
    }).defaultNow(),
    status: (0, exports.taskStatus)().default("todo"),
    effort: (0, exports.taskEffort)(),
    groupId: (0, pg_core_1.uuid)("group_id"),
    isTemplate: (0, pg_core_1.boolean)().default(false).notNull(),
    templateId: (0, pg_core_1.uuid)(),
    priority: (0, exports.taskPriority)(),
    assigneeId: (0, pg_core_1.uuid)("assignee_id"),
}, (table) => [
    (0, pg_core_1.index)("idx_tasks_group_id").using("btree", table.groupId.asc().nullsLast().op("uuid_ops")),
    (0, pg_core_1.index)("idx_tasks_parent_id").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
    (0, pg_core_1.index)("idx_tasks_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.assigneeId],
        foreignColumns: [exports.usersInAuth.id],
        name: "tasks_assignee_id_fkey",
    }),
    (0, pg_core_1.foreignKey)({
        columns: [table.assigneeId],
        foreignColumns: [exports.users.id],
        name: "tasks_assignee_id_fkey1",
    }),
    (0, pg_core_1.foreignKey)({
        columns: [table.groupId],
        foreignColumns: [exports.taskGroups.id],
        name: "tasks_group_id_fkey",
    }).onDelete("set null"),
    (0, pg_core_1.foreignKey)({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "tasks_parent_id_fkey",
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.templateId],
        foreignColumns: [table.id],
        name: "tasks_templateId_fkey",
    }),
    (0, pg_core_1.pgPolicy)("Users can delete own tasks", {
        as: "permissive",
        for: "delete",
        to: ["public"],
        using: (0, drizzle_orm_1.sql) `(auth.uid() = user_id)`,
    }),
    (0, pg_core_1.pgPolicy)("Users can insert own tasks", {
        as: "permissive",
        for: "insert",
        to: ["public"],
    }),
    (0, pg_core_1.pgPolicy)("Users can update own tasks", {
        as: "permissive",
        for: "update",
        to: ["public"],
    }),
    (0, pg_core_1.pgPolicy)("Users can view own tasks", {
        as: "permissive",
        for: "select",
        to: ["public"],
    }),
]);
exports.system = (0, pg_core_1.pgTable)("system", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: (0, pg_core_1.bigint)({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
        name: "system_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        cache: 1,
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: "string" })
        .defaultNow()
        .notNull(),
    creatorId: (0, pg_core_1.uuid)("creator_id"),
    name: (0, pg_core_1.varchar)().notNull(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.creatorId],
        foreignColumns: [exports.usersInAuth.id],
        name: "system_creator_id_fkey",
    }),
]);
exports.assignHistory = (0, pg_core_1.pgTable)("assign_history", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: (0, pg_core_1.bigint)({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
        name: "assign_history_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        cache: 1,
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: "string" })
        .defaultNow()
        .notNull(),
    purpose: (0, pg_core_1.varchar)(),
    instruction: (0, pg_core_1.text)(),
    assignorId: (0, pg_core_1.uuid)("assignor_id").defaultRandom(),
    taskId: (0, pg_core_1.uuid)("task_id").notNull(),
    assigneeId: (0, pg_core_1.uuid)("assignee_id"),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.assigneeId],
        foreignColumns: [exports.users.id],
        name: "assign_history_assignee_id_fkey",
    }),
    (0, pg_core_1.foreignKey)({
        columns: [table.assignorId],
        foreignColumns: [exports.users.id],
        name: "assign_history_assignor_id_fkey",
    }),
    (0, pg_core_1.foreignKey)({
        columns: [table.taskId],
        foreignColumns: [exports.tasks.id],
        name: "assign_history_task_id_fkey",
    }),
]);
exports.taskGoals = (0, pg_core_1.pgTable)("task_goals", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey().notNull(),
    taskId: (0, pg_core_1.uuid)("task_id").notNull(),
    goalId: (0, pg_core_1.uuid)("goal_id").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
        withTimezone: true,
        mode: "string",
    }).defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_task_goals_goal_id").using("btree", table.goalId.asc().nullsLast().op("uuid_ops")),
    (0, pg_core_1.index)("idx_task_goals_task_id").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.goalId],
        foreignColumns: [exports.goals.id],
        name: "task_goals_goal_id_fkey",
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.taskId],
        foreignColumns: [exports.tasks.id],
        name: "task_goals_task_id_fkey",
    }).onDelete("cascade"),
    (0, pg_core_1.unique)("task_goals_task_id_goal_id_key").on(table.taskId, table.goalId),
    (0, pg_core_1.pgPolicy)("Users can manage their own task-goal relationships", {
        as: "permissive",
        for: "all",
        to: ["public"],
        using: (0, drizzle_orm_1.sql) `(EXISTS ( SELECT 1
   FROM tasks
  WHERE ((tasks.id = task_goals.task_id) AND (tasks.user_id = auth.uid()))))`,
    }),
]);
exports.systemUsers = (0, pg_core_1.pgTable)("system_users", {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: (0, pg_core_1.bigint)({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
        name: "system_users_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        cache: 1,
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: "string" })
        .defaultNow()
        .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    systemId: (0, pg_core_1.bigint)("system_id", { mode: "number" }),
    userId: (0, pg_core_1.uuid)("user_id"),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.systemId],
        foreignColumns: [exports.system.id],
        name: "system_users_system_id_fkey",
    }),
    (0, pg_core_1.foreignKey)({
        columns: [table.userId],
        foreignColumns: [exports.users.id],
        name: "system_users_user_id_fkey",
    }),
]);
exports.taskGroups = (0, pg_core_1.pgTable)("task_groups", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey().notNull(),
    title: (0, pg_core_1.text)().notNull(),
    goalId: (0, pg_core_1.uuid)("goal_id").notNull(),
    userId: (0, pg_core_1.uuid)("user_id").notNull(),
    orderIndex: (0, pg_core_1.integer)("order_index").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
        withTimezone: true,
        mode: "string",
    }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", {
        withTimezone: true,
        mode: "string",
    }).defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_task_groups_goal_id").using("btree", table.goalId.asc().nullsLast().op("uuid_ops")),
    (0, pg_core_1.index)("idx_task_groups_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.goalId],
        foreignColumns: [exports.goals.id],
        name: "task_groups_goal_id_fkey",
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.userId],
        foreignColumns: [exports.usersInAuth.id],
        name: "task_groups_user_id_fkey",
    }).onDelete("cascade"),
]);

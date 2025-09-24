import { relations } from "drizzle-orm/relations";
import { usersInAuth, users, goals, energyReadings, tasks, taskGroups, system, assignHistory, taskGoals, systemUsers } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [users.id],
		references: [usersInAuth.id]
	}),
	goals: many(goals),
	energyReadings: many(energyReadings),
	tasks_assigneeId: many(tasks, {
		relationName: "tasks_assigneeId_users_id"
	}),
	tasks_userId: many(tasks, {
		relationName: "tasks_userId_users_id"
	}),
	assignHistories_assigneeId: many(assignHistory, {
		relationName: "assignHistory_assigneeId_users_id"
	}),
	assignHistories_assignorId: many(assignHistory, {
		relationName: "assignHistory_assignorId_users_id"
	}),
	systemUsers: many(systemUsers),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	users: many(users),
	tasks: many(tasks),
	systems: many(system),
	taskGroups: many(taskGroups),
}));

export const goalsRelations = relations(goals, ({one, many}) => ({
	user: one(users, {
		fields: [goals.userId],
		references: [users.id]
	}),
	taskGoals: many(taskGoals),
	taskGroups: many(taskGroups),
}));

export const energyReadingsRelations = relations(energyReadings, ({one}) => ({
	user: one(users, {
		fields: [energyReadings.userId],
		references: [users.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [tasks.assigneeId],
		references: [usersInAuth.id]
	}),
	user_assigneeId: one(users, {
		fields: [tasks.assigneeId],
		references: [users.id],
		relationName: "tasks_assigneeId_users_id"
	}),
	taskGroup: one(taskGroups, {
		fields: [tasks.groupId],
		references: [taskGroups.id]
	}),
	task_parentId: one(tasks, {
		fields: [tasks.parentId],
		references: [tasks.id],
		relationName: "tasks_parentId_tasks_id"
	}),
	tasks_parentId: many(tasks, {
		relationName: "tasks_parentId_tasks_id"
	}),
	task_templateId: one(tasks, {
		fields: [tasks.templateId],
		references: [tasks.id],
		relationName: "tasks_templateId_tasks_id"
	}),
	tasks_templateId: many(tasks, {
		relationName: "tasks_templateId_tasks_id"
	}),
	user_userId: one(users, {
		fields: [tasks.userId],
		references: [users.id],
		relationName: "tasks_userId_users_id"
	}),
	assignHistories: many(assignHistory),
	taskGoals: many(taskGoals),
}));

export const taskGroupsRelations = relations(taskGroups, ({one, many}) => ({
	tasks: many(tasks),
	goal: one(goals, {
		fields: [taskGroups.goalId],
		references: [goals.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [taskGroups.userId],
		references: [usersInAuth.id]
	}),
}));

export const systemRelations = relations(system, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [system.creatorId],
		references: [usersInAuth.id]
	}),
	systemUsers: many(systemUsers),
}));

export const assignHistoryRelations = relations(assignHistory, ({one}) => ({
	user_assigneeId: one(users, {
		fields: [assignHistory.assigneeId],
		references: [users.id],
		relationName: "assignHistory_assigneeId_users_id"
	}),
	user_assignorId: one(users, {
		fields: [assignHistory.assignorId],
		references: [users.id],
		relationName: "assignHistory_assignorId_users_id"
	}),
	task: one(tasks, {
		fields: [assignHistory.taskId],
		references: [tasks.id]
	}),
}));

export const taskGoalsRelations = relations(taskGoals, ({one}) => ({
	goal: one(goals, {
		fields: [taskGoals.goalId],
		references: [goals.id]
	}),
	task: one(tasks, {
		fields: [taskGoals.taskId],
		references: [tasks.id]
	}),
}));

export const systemUsersRelations = relations(systemUsers, ({one}) => ({
	system: one(system, {
		fields: [systemUsers.systemId],
		references: [system.id]
	}),
	user: one(users, {
		fields: [systemUsers.userId],
		references: [users.id]
	}),
}));
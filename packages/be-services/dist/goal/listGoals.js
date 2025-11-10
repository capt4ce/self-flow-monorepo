"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGoals = listGoals;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function listGoals(userId, status) {
    const db = (0, db_1.getDb)();
    // Ensure status is valid, default to "active" if not provided or invalid
    const validStatus = status === "active" || status === "done" ? status : "active";
    const goalsList = await db
        .select()
        .from(schema_1.goals)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.goals.userId, userId), (0, drizzle_orm_1.eq)(schema_1.goals.status, validStatus)))
        .orderBy(schema_1.goals.createdAt);
    // Get tasks for each goal
    const goalsWithTasks = await Promise.all(goalsList.map(async (goal) => {
        // Get task-goal relationships
        const taskGoalRelations = await db
            .select()
            .from(schema_1.taskGoals)
            .where((0, drizzle_orm_1.eq)(schema_1.taskGoals.goalId, goal.id));
        if (taskGoalRelations.length === 0) {
            return {
                ...goal,
                tasks: [],
                taskGroups: [],
            };
        }
        const taskIds = taskGoalRelations.map((tg) => tg.taskId);
        // Get tasks
        const tasksList = taskIds.length > 0
            ? await db
                .select()
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId), (0, drizzle_orm_1.inArray)(schema_1.tasks.id, taskIds)))
                .orderBy(schema_1.tasks.orderIndex)
            : [];
        // Get task groups
        const groupsList = await db
            .select()
            .from(schema_1.taskGroups)
            .where((0, drizzle_orm_1.eq)(schema_1.taskGroups.goalId, goal.id));
        // Sort tasks by order_index
        const sortedTasks = tasksList
            .sort((a, b) => (a?.orderIndex ?? 0) - (b?.orderIndex ?? 0))
            .map((task) => ({
            ...task,
            goal_id: goal.id,
        }));
        return {
            ...goal,
            tasks: sortedTasks,
            taskGroups: groupsList,
        };
    }));
    return goalsWithTasks;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTasks = listTasks;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function listTasks(userId, limit = 20, offset = 0) {
    const db = (0, db_1.getDb)();
    const tasksList = await db
        .select()
        .from(schema_1.tasks)
        .where((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId))
        .limit(limit)
        .offset(offset)
        .orderBy(schema_1.tasks.orderIndex);
    // Get task-goal relationships for these tasks
    const taskIds = tasksList.map((t) => t.id);
    const taskGoalRelations = taskIds.length > 0
        ? await db
            .select()
            .from(schema_1.taskGoals)
            .where((0, drizzle_orm_1.inArray)(schema_1.taskGoals.taskId, taskIds))
        : [];
    // Get goals for these relationships
    const goalIds = [...new Set(taskGoalRelations.map((tg) => tg.goalId))];
    const goalsList = goalIds.length > 0
        ? await db
            .select()
            .from(schema_1.goals)
            .where((0, drizzle_orm_1.inArray)(schema_1.goals.id, goalIds))
        : [];
    // Create a map of taskId -> goal
    const goalMap = new Map();
    goalsList.forEach((goal) => goalMap.set(goal.id, goal));
    const taskGoalMap = new Map();
    taskGoalRelations.forEach((tg) => taskGoalMap.set(tg.taskId, tg));
    // Attach goal info to tasks
    const tasksWithGoals = tasksList.map((task) => {
        const tg = taskGoalMap.get(task.id);
        const goal = tg ? goalMap.get(tg.goalId) : null;
        return {
            ...task,
            goalTitle: goal?.title || "",
            goalId: goal?.id || "",
            goal_id: goal?.id,
        };
    });
    return tasksWithGoals;
}

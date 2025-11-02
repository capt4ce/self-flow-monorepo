# Frontend Operations with Multiple Mutation API Calls

This document lists all frontend operations that make multiple mutation API calls in sequence.

## 1. GoalFormDialog.tsx - `handleSaveGoal`

**Location:** `packages/fe/src/components/dialogs/GoalFormDialog.tsx:106`

**Operations:**
- Creates or updates a goal (`api.goals.create` or `api.goals.update`)
- For new goals:
  - Creates multiple tasks in a loop (`api.tasks.create` - called N times for new tasks)
  - Updates multiple existing tasks to link them to the goal (`api.tasks.update` - called M times for selected tasks)
- For editing existing goals:
  - Updates goal (`api.goals.update`)
  - Removes goalId from unselected tasks (`api.tasks.update` - called P times)
  - Creates new tasks (`api.tasks.create` - called Q times)
  - Updates existing tasks to link them to goal (`api.tasks.update` - called R times)

**Example scenario:** Creating a goal with 5 new tasks and linking 3 existing tasks = 1 create + 5 creates + 3 updates = **9 API calls**

---

## 2. TaskDialog.tsx - `handleSave`

**Location:** `packages/fe/src/components/dialogs/TaskDialog.tsx:105`

**Operations:**
- Creates or updates the main task (`api.tasks.create` or `api.tasks.update`)
- Creates multiple subtasks in a loop (`api.tasks.create` - called N times for new subtasks)
- Updates multiple existing tasks to set them as subtasks (`api.tasks.update` - called M times for selected tasks)

**Example scenario:** Creating a task with 3 new subtasks and linking 2 existing tasks as subtasks = 1 create + 3 creates + 2 updates = **6 API calls**

---

## 3. GoalCard.tsx - `handleDragEnd`

**Location:** `packages/fe/src/components/common/GoalCard.tsx:89`

**Operations:**
- Batch reorders multiple tasks (`api.tasks.reorder` - single call but updates multiple tasks)

**Note:** While this is a single API call, it's a batch operation that mutates multiple task entities. The `reorder` endpoint accepts an array of `{ taskId, orderIndex }` and updates orderIndex for all tasks in the array.

**Example scenario:** Reordering 10 tasks = **1 batch API call** that updates 10 tasks

---

## Summary

| Component | Function | Min API Calls | Max API Calls | Notes |
|-----------|----------|---------------|---------------|-------|
| GoalFormDialog | handleSaveGoal | 1 | N+M+1 (new) or 1+P+Q+R (edit) | Creates/updates goal + multiple task operations |
| TaskDialog | handleSave | 1 | 1+N+M | Creates/updates task + multiple subtask operations |
| GoalCard | handleDragEnd | 1 | 1 | Batch reorder (updates multiple tasks in one call) |

**Potential Improvements:**
- Consider batch endpoints for task creation (e.g., `POST /tasks/batch`)
- Consider batch endpoints for task updates (e.g., `PUT /tasks/batch`)
- For GoalFormDialog, could use a single endpoint like `POST /goals/with-tasks` that handles goal + tasks in one transaction


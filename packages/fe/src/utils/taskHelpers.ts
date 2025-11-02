import { TaskDTO } from "@self-flow/common/types";

export const findTaskById = (
  tasks: TaskDTO[],
  taskId: string
): TaskDTO | null => {
  for (const task of tasks) {
    if (task.id === taskId) return task;
    if (task.subtasks) {
      const found = findTaskById(task.subtasks, taskId);
      if (found) return found;
    }
  }
  return null;
};

export const updateTaskInArray = (
  tasks: TaskDTO[],
  taskId: string,
  updatedTask: TaskDTO
): TaskDTO[] => {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return updatedTask;
    }
    return {
      ...task,
      subtasks: task.subtasks
        ? updateTaskInArray(task.subtasks, taskId, updatedTask)
        : [],
    };
  });
};

export const deleteTaskFromArray = (
  tasks: TaskDTO[],
  taskId: string
): TaskDTO[] => {
  return tasks
    .filter((task) => task.id !== taskId)
    .map((task) => ({
      ...task,
      subtasks: task.subtasks
        ? deleteTaskFromArray(task.subtasks, taskId)
        : [],
    }));
};

export const addTaskToArray = (
  tasks: TaskDTO[],
  parentId: string | undefined,
  newTask: TaskDTO
): TaskDTO[] => {
  if (!parentId) {
    return [...tasks, newTask];
  }
  return tasks.map((task) => {
    if (task.id === parentId) {
      return {
        ...task,
        subtasks: [...(task.subtasks || []), newTask],
      };
    }
    return {
      ...task,
      subtasks: task.subtasks
        ? addTaskToArray(task.subtasks, parentId, newTask)
        : [],
    };
  });
};

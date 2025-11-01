interface Task {
  id: string;
  subtasks: Task[];
  [key: string]: any;
}

export const findTaskById = (tasks: Task[], taskId: string): Task | null => {
  for (const task of tasks) {
    if (task.id === taskId) return task;
    const found = findTaskById(task.subtasks, taskId);
    if (found) return found;
  }
  return null;
};

export const updateTaskInArray = (
  tasks: Task[],
  taskId: string,
  updatedTask: Task,
): Task[] => {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return updatedTask;
    }
    return {
      ...task,
      subtasks: updateTaskInArray(task.subtasks, taskId, updatedTask),
    };
  });
};

export const deleteTaskFromArray = (tasks: Task[], taskId: string): Task[] => {
  return tasks
    .filter((task) => task.id !== taskId)
    .map((task) => ({
      ...task,
      subtasks: deleteTaskFromArray(task.subtasks, taskId),
    }));
};

export const addTaskToArray = (
  tasks: Task[],
  parentId: string | undefined,
  newTask: Task,
): Task[] => {
  if (!parentId) {
    return [...tasks, newTask];
  }
  return tasks.map((task) => {
    if (task.id === parentId) {
      return {
        ...task,
        subtasks: [...task.subtasks, newTask],
      };
    }
    return {
      ...task,
      subtasks: addTaskToArray(task.subtasks, parentId, newTask),
    };
  });
};



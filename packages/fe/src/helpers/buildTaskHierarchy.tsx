import { TaskDTO } from "@self-flow/common/types";

const buildTaskHierarchy = (tasks: TaskDTO[]): TaskDTO[] => {
  const taskMap = new Map();
  const rootTasks: TaskDTO[] = [];

  // First pass: create all tasks
  tasks.forEach((task) => {
    taskMap.set(task.id, {
      ...task,
      subtasks: [],
    });
  });

  // Second pass: build hierarchy
  tasks.forEach((task) => {
    const taskObj = taskMap.get(task.id);
    if (task.parentId) {
      const parent = taskMap.get(task.parentId);
      if (parent) {
        parent.subtasks.push(taskObj);
      }
    } else {
      rootTasks.push(taskObj);
    }
  });

  // Sort tasks: active tasks first, completed tasks, then "not done" tasks
  const sortTasks = (taskList: TaskDTO[]): TaskDTO[] => {
    const active = taskList
      .filter((task) => !task.completed && task.status !== "not done")
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const completed = taskList
      .filter((task) => task.completed && task.status !== "not done")
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const notDone = taskList
      .filter((task) => task.status === "not done")
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    return [...active, ...completed, ...notDone].map((task) => ({
      ...task,
      subtasks: sortTasks(task.subtasks || []),
    }));
  };

  return sortTasks(rootTasks);
};

export default buildTaskHierarchy;

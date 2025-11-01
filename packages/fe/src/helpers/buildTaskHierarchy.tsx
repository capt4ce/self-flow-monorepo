interface Task {
  id: string;
  parent_id?: string | null;
  order_index?: number;
  completed?: boolean;
  status?: string;
  subtasks: Task[];
  [key: string]: any;
}

const buildTaskHierarchy = (tasks: Task[]): Task[] => {
  const taskMap = new Map();
  const rootTasks: Task[] = [];

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
    if (task.parent_id) {
      const parent = taskMap.get(task.parent_id);
      if (parent) {
        parent.subtasks.push(taskObj);
      }
    } else {
      rootTasks.push(taskObj);
    }
  });

  // Sort tasks: active tasks first, completed tasks, then "not done" tasks
  const sortTasks = (taskList: Task[]): Task[] => {
    const active = taskList
      .filter((task) => !task.completed && task.status !== "not done")
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const completed = taskList
      .filter((task) => task.completed && task.status !== "not done")
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const notDone = taskList
      .filter((task) => task.status === "not done")
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    return [...active, ...completed, ...notDone].map((task) => ({
      ...task,
      subtasks: sortTasks(task.subtasks),
    }));
  };

  return sortTasks(rootTasks);
};

export default buildTaskHierarchy;



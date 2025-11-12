import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { TaskDTO } from "@self-flow/common/types";
import { api } from "@/lib/api-client";
import { useAuth } from "./AuthContext";

type SubtasksContextType = {
  subtasks: Record<string, TaskDTO[]>;
  fetchTaskSubtasks: (task: TaskDTO) => Promise<TaskDTO[]>;
  refreshSubtasks: () => Promise<void>;
};

const SubtasksContext = createContext<SubtasksContextType | undefined>(
  undefined
);

const normalizeTask = (task: TaskDTO): TaskDTO => {
  const normalizedSubtasks =
    task.subtasks?.map((subtask) => normalizeTask(subtask)) ?? [];
  const inferredCount =
    task.subtaskCount !== undefined
      ? task.subtaskCount
      : normalizedSubtasks.length;

  return {
    ...task,
    subtasks: normalizedSubtasks,
    subtaskCount: inferredCount,
  };
};

export const useSubtasks = () => {
  const context = useContext(SubtasksContext);
  if (context === undefined) {
    throw new Error("useSubtasks must be used within a SubtasksProvider");
  }
  return context;
};

export const SubtasksProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [subtasks, setSubtasks] = useState<Record<string, TaskDTO[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const fetchTaskSubtasks = async (task: TaskDTO) => {
    const parentId = task.id;
    if (!parentId) {
      console.error("Cannot fetch subtasks for task without an ID");
      return [];
    }

    if (subtasks[parentId]) {
      return subtasks[parentId];
    }

    if (task.subtasks && task.subtasks.length > 0) {
      const normalized = task.subtasks.map((subtask) => normalizeTask(subtask));
      setSubtasks((prev) => ({ ...prev, [parentId]: normalized }));
      return normalized;
    }

    if (!user) {
      setSubtasks((prev) => ({ ...prev, [parentId]: [] }));
      return [];
    }

    if (loadingMap[parentId]) {
      return subtasks[parentId] ?? [];
    }

    setLoadingMap((prev) => ({ ...prev, [parentId]: true }));

    try {
      const data = await api.tasks.listSubtasks([parentId]);
      const fetched = (data[parentId] || []).map((subtask) =>
        normalizeTask(subtask)
      );
      setSubtasks((prev) => ({ ...prev, [parentId]: fetched }));
      return fetched;
    } catch (error) {
      console.error("Error fetching subtasks:", error);
      setSubtasks((prev) => ({ ...prev, [parentId]: [] }));
      return [];
    } finally {
      setLoadingMap((prev) => {
        const next = { ...prev };
        delete next[parentId];
        return next;
      });
    }
  };

  const refreshSubtasks = async () => {
    const taskIds = Object.keys(subtasks);
    if (taskIds.length === 0 || !user) {
      return;
    }

    try {
      const data = await api.tasks.listSubtasks(taskIds);
      const updated = taskIds.reduce<Record<string, TaskDTO[]>>(
        (acc, taskId) => {
          const list = data[taskId] || [];
          acc[taskId] = list.map((subtask) => normalizeTask(subtask));
          return acc;
        },
        {}
      );
      setSubtasks(updated);
    } catch (error) {
      console.error("Error refreshing subtasks:", error);
    }
  };

  const value = useMemo(
    () => ({
      subtasks,
      fetchTaskSubtasks,
      refreshSubtasks,
    }),
    [subtasks]
  );

  return (
    <SubtasksContext.Provider value={value}>
      {children}
    </SubtasksContext.Provider>
  );
};

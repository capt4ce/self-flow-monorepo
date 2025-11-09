
import React, { createContext, useContext, useState } from "react";
import { TaskDTO } from "@self-flow/common/types";
import { api } from "@/lib/api-client";
import { useAuth } from "./AuthContext";

type SubtasksContextType = {
  subtasks: Record<string, TaskDTO[]>;
  fetchTaskSubtasks: (taskId: string) => Promise<void>;
  refreshSubtasks: () => Promise<void>;
};

const SubtasksContext = createContext<SubtasksContextType | undefined>(
  undefined
);

export const useSubtasks = () => {
  const context = useContext(SubtasksContext);
  if (context === undefined) {
    throw new Error("useSubtasks must be used within an SubtasksProvider");
  }
  return context;
};

export const SubtasksProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  // subtasks grouped by the parent task id
  const [subtasks, setSubtasks] = useState<Record<string, TaskDTO[]>>({});

  const fetchTaskSubtasks = async (taskId: string) => {
    if (!user || subtasks[taskId]) return;

    try {
      const data = await api.tasks.listSubtasks([taskId]);
      const subtasksData = (data[taskId] || []).map((task) => ({
        ...task,
        subtasks: [],
      }));
      setSubtasks((prev) => ({ ...prev, [taskId]: subtasksData }));
    } catch (error) {
      console.error("Error fetching subtasks:", error);
    }
  };

  const refreshSubtasks = async () => {
    const taskIds = Object.keys(subtasks);
    if (taskIds.length === 0) return;
    
    const data = await api.tasks.listSubtasks(taskIds);
    setSubtasks(data);
  };

  const value = {
    subtasks,
    fetchTaskSubtasks,
    refreshSubtasks,
  };

  return (
    <SubtasksContext.Provider value={value}>
      {children}
    </SubtasksContext.Provider>
  );
};


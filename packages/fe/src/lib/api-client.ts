import type {
  GoalDTO,
  CreateGoalDTO,
  UpdateGoalDTO,
  TaskDTO,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskGroupDTO,
  CreateTaskGroupDTO,
  UpdateTaskGroupDTO,
  EnergyReadingDTO,
  CreateEnergyReadingDTO,
  UpdateEnergyReadingDTO,
} from "@self-flow/common/types";

// In development, use relative URL which will be proxied by Vite
// In production, use the full API URL from environment variable
const API_BASE_URL =
  import.meta.env.DEV
    ? "/api" // Use relative URL in development (proxied by Vite)
    : import.meta.env.VITE_API_URL || "http://localhost:8787/api";

// Extend Window interface for token getter
declare global {
  interface Window {
    __stackAuthTokenGetter?: () => Promise<string | null>;
  }
}

// Set token globally (called from auth context)
export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  if (typeof window !== "undefined") {
    window.__stackAuthTokenGetter = getter;
  }
}

// Get auth token from Stack Auth - uses global getter set by AuthProvider
async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const getter = window.__stackAuthTokenGetter;
  if (getter) {
    return await getter();
  }
  return null;
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? await getAuthToken() : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("No auth token available for API request to:", endpoint);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Include credentials (cookies, auth headers) in CORS requests
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    console.error("API error:", response.status, error);
    throw new Error(
      error.message || error.error || `API error: ${response.statusText}`
    );
  }

  return response.json();
}

export const api = {
  // Goals
  goals: {
    list: (status: string) =>
      fetchAPI<{ data: GoalDTO[] }>(`/goals?status=${status}`),
    create: (data: CreateGoalDTO & {
      newTasks?: Array<{
        title: string;
        description?: string;
        effort?: string;
        status?: string;
        templateId?: string;
      }>;
      existingTaskIds?: string[];
    }) =>
      fetchAPI<{ data: GoalDTO }>("/goals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateGoalDTO & {
      newTasks?: Array<{
        title: string;
        description?: string;
        effort?: string;
        status?: string;
        templateId?: string;
      }>;
      selectedTaskIds?: string[];
      currentTaskIds?: string[];
    }) =>
      fetchAPI<{ data: GoalDTO }>(`/goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchAPI<{ message: string }>(`/goals/${id}`, { method: "DELETE" }),
  },

  // Tasks
  tasks: {
    list: (limit = 20, offset = 0) =>
      fetchAPI<{ data: TaskDTO[] }>(`/tasks?limit=${limit}&offset=${offset}`),
    create: (data: CreateTaskDTO & {
      newSubtasks?: Array<{
        title: string;
        description?: string;
        effort?: string;
        priority?: string;
        status?: string;
        goalId?: string;
      }>;
      existingSubtaskIds?: string[];
    }) =>
      fetchAPI<{ data: TaskDTO }>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateTaskDTO & {
      newSubtasks?: Array<{
        title: string;
        description?: string;
        effort?: string;
        priority?: string;
        status?: string;
        goalId?: string;
      }>;
      selectedSubtaskIds?: string[];
      currentSubtaskIds?: string[];
    }) =>
      fetchAPI<{ data: TaskDTO }>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchAPI<{ message: string }>(`/tasks/${id}`, { method: "DELETE" }),
    reorder: (orders: Array<{ taskId: string; orderIndex: number }>) =>
      fetchAPI<{ message: string }>("/tasks/reorder", {
        method: "POST",
        body: JSON.stringify({ orders }),
      }),
    listSubtasks: (parentIds: string[]) =>
      fetchAPI<Record<string, TaskDTO[]>>("/tasks/subtasks", {
        method: "POST",
        body: JSON.stringify({ parentIds }),
      }),
    listSubtaskCounts: (parentIds: string[]) =>
      fetchAPI<Array<{ parent_id: string; subtaskCount: number }>>(
        "/tasks/subtask-counts",
        {
          method: "POST",
          body: JSON.stringify({ parentIds }),
        }
      ),
    // Search is implemented client-side by fetching and filtering
    search: async (
      searchQuery: string,
      filters?: {
        isTemplate?: boolean;
        excludeStatus?: string[];
        excludeCompleted?: boolean;
      }
    ) => {
      const allTasks = await fetchAPI<{ data: TaskDTO[] }>(
        `/tasks?limit=100&offset=0`
      );
      let filtered = allTasks.data;

      // Apply filters
      if (filters?.isTemplate !== undefined) {
        filtered = filtered.filter((t) => t.isTemplate === filters.isTemplate);
      }
      if (filters?.excludeStatus) {
        filtered = filtered.filter(
          (t) => t.status && !filters.excludeStatus?.includes(t.status)
        );
      }
      if (filters?.excludeCompleted) {
        filtered = filtered.filter((t) => !t.completed);
      }

      // Apply search query
      if (searchQuery.trim()) {
        const searchTerms = searchQuery
          .split(" ")
          .filter((term) => term.trim() !== "");
        filtered = filtered.filter((task) =>
          searchTerms.some((term) =>
            task.title?.toLowerCase().includes(term.toLowerCase())
          )
        );
      }

      return { data: filtered.slice(0, 20) };
    },
  },

  // Task Groups
  taskGroups: {
    create: (data: CreateTaskGroupDTO) =>
      fetchAPI<{ data: TaskGroupDTO }>("/task-groups", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateTaskGroupDTO) =>
      fetchAPI<{ data: TaskGroupDTO }>(`/task-groups/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchAPI<{ message: string }>(`/task-groups/${id}`, { method: "DELETE" }),
  },

  // Energy
  energy: {
    list: () => fetchAPI<{ data: EnergyReadingDTO[] }>("/energy"),
    create: (data: CreateEnergyReadingDTO) =>
      fetchAPI<{ data: EnergyReadingDTO }>("/energy", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateEnergyReadingDTO) =>
      fetchAPI<{ data: EnergyReadingDTO }>(`/energy/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchAPI<{ message: string }>(`/energy/${id}`, { method: "DELETE" }),
  },
};

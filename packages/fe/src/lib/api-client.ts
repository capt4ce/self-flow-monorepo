const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/api";

// Set token globally (called from auth context)
export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  if (typeof window !== "undefined") {
    (window as any).__stackAuthTokenGetter = getter;
  }
}

// Get auth token from Stack Auth - uses global getter set by AuthProvider
async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  
  const getter = (window as any).__stackAuthTokenGetter;
  if (getter) {
    return await getter();
  }
  return null;
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" 
    ? await getAuthToken() 
    : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("No auth token available for API request to:", endpoint);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    console.error("API error:", response.status, error);
    throw new Error(error.message || error.error || `API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Goals
  goals: {
    list: (status: string) => fetchAPI<{ data: any[] }>(`/goals?status=${status}`),
    create: (data: any) => fetchAPI<{ data: any }>("/goals", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<{ data: any }>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/goals/${id}`, { method: "DELETE" }),
  },

  // Tasks
  tasks: {
    list: (limit = 20, offset = 0) => fetchAPI<{ data: any[] }>(`/tasks?limit=${limit}&offset=${offset}`),
    create: (data: any) => fetchAPI<{ data: any }>("/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<{ data: any }>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/tasks/${id}`, { method: "DELETE" }),
    reorder: (orders: Array<{ taskId: string; orderIndex: number }>) =>
      fetchAPI<{ message: string }>("/tasks/reorder", { method: "POST", body: JSON.stringify({ orders }) }),
    listSubtasks: (parentIds: string[]) =>
      fetchAPI<Record<string, any[]>>("/tasks/subtasks", { method: "POST", body: JSON.stringify({ parentIds }) }),
    listSubtaskCounts: (parentIds: string[]) =>
      fetchAPI<Array<{ parent_id: string; subtaskCount: number }>>("/tasks/subtask-counts", {
        method: "POST",
        body: JSON.stringify({ parentIds }),
      }),
  },

  // Task Groups
  taskGroups: {
    create: (data: any) => fetchAPI<{ data: any }>("/task-groups", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<{ data: any }>(`/task-groups/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/task-groups/${id}`, { method: "DELETE" }),
  },

  // Energy
  energy: {
    list: () => fetchAPI<{ data: any[] }>("/energy"),
    create: (data: any) => fetchAPI<{ data: any }>("/energy", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<{ data: any }>(`/energy/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<{ message: string }>(`/energy/${id}`, { method: "DELETE" }),
  },
};


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TaskDTO } from "@self-flow/common/types";
import { getEffortBadgeColor, getStatusBadgeColor } from "@/utils/badgeColors";
import TaskDialog from "@/components/dialogs/TaskDialog";
import { api } from "@/lib/api-client";

export default function TasksPage() {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState<TaskDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [effortFilter, setEffortFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);

  const fetchAllTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.tasks.list(100, 0);
      setAllTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllTasks();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredTasks = allTasks.filter((task) => {
    // Status filter
    if (statusFilter !== "all" && task.status !== statusFilter) return false;

    if (!["done", "not done"].includes(statusFilter) && task.completed)
      return false;

    // Effort filter
    if (effortFilter !== "all" && task.effort !== effortFilter) return false;

    // Template filter
    if (templateFilter === "templates" && !task.isTemplate) return false;
    if (templateFilter === "non-templates" && task.isTemplate) return false;

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return (
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        false
      );
    }

    return true;
  });

  const handleToggleComplete = async (taskId: string) => {
    if (!user) return;

    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await api.tasks.update(taskId, { completed: !task.completed });
      setAllTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const handleEditTask = (task: TaskDTO) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      await api.tasks.delete(taskId);
      setAllTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">All Tasks</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and manage all tasks across all goals
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="not done">Not Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={effortFilter} onValueChange={setEffortFilter}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Effort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Effort</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="med">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="templates">Templates Only</SelectItem>
                  <SelectItem value="non-templates">Non-Templates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreateTask} className="w-full sm:w-auto" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          task={editingTask || undefined}
          onSaved={() => {
            fetchAllTasks();
            setTaskDialogOpen(false);
            setEditingTask(null);
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && allTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading tasks...</p>
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border rounded-lg hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={task.completed || false}
                      onCheckedChange={() => handleToggleComplete(task.id!)}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <h3
                          className={`font-medium break-words ${
                            task.completed ? "line-through text-muted-foreground" : ""
                          } ${
                            task.status === "not done"
                              ? "line-through text-red-500"
                              : ""
                          }`}
                        >
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {task.status && (
                            <Badge
                              className={`text-xs ${getStatusBadgeColor(
                                task.status
                              )}`}
                            >
                              {task.status}
                            </Badge>
                          )}
                          {task.effort && (
                            <Badge
                              className={`text-xs ${getEffortBadgeColor(
                                task.effort
                              )}`}
                            >
                              {task.effort}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {task.description && (
                        <div
                          className={`mt-2 text-xs sm:text-sm ${
                            task.completed
                              ? "text-muted-foreground"
                              : "text-foreground/70"
                          }`}
                          dangerouslySetInnerHTML={{ __html: task.description }}
                        />
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Edit task"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit size={16} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            title="Delete task"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{task.title}&quot;?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTask(task.id!)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


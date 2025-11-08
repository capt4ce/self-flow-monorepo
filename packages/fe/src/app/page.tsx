"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import TaskDialog from "@/components/dialogs/TaskDialog";
import { TaskDTO } from "@self-flow/common/types";
import { useSubtasks } from "@/contexts/SubtasksContext";
import WeekCalendarWidget from "@/components/common/WeekCalendarWidget";
import MonthCalendarDialog from "@/components/dialogs/MonthCalendarDialog";
import TaskListItem from "@/components/common/TaskListItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { user, loading } = useAuth();
  const [allTasks, setAllTasks] = useState<TaskDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [taskFormData, setTaskFormData] = useState<Partial<TaskDTO> & { goal_id?: string }>({
    title: "",
    description: "",
    status: "todo",
    completed: false,
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [monthCalendarOpen, setMonthCalendarOpen] = useState(false);
  const { refreshSubtasks } = useSubtasks();

  useEffect(() => {
    if (user && !loading) {
      fetchAllTasks();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
  }, [user, loading]);

  const fetchAllTasks = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await api.tasks.list(1000, 0);
      setAllTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tasks by selected date (by creation date)
  const dailyTasks = useMemo(() => {
    if (!selectedDate || !(selectedDate instanceof Date)) return [];
    
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      return allTasks.filter((task) => {
        if (!task.createdAt) return false;
        try {
          const taskDate = new Date(task.createdAt);
          if (isNaN(taskDate.getTime())) return false;
          return taskDate >= startOfDay && taskDate <= endOfDay;
        } catch (e) {
          console.error("Error parsing task date:", task.createdAt, e);
          return false;
        }
      });
    } catch (e) {
      console.error("Error filtering tasks by date:", e);
      return [];
    }
  }, [allTasks, selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleOpenMonthCalendar = () => {
    setMonthCalendarOpen(true);
  };

  const handleMonthCalendarDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      setSelectedDate(newDate);
    }
  };

  const handleEditTask = (task: TaskDTO) => {
    setEditingTask(task);
    setTaskFormData({
      ...task,
      status: task.status || "todo",
      goal_id: task.goal_id,
    });
    setTaskDialogOpen(true);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskFormData({
      title: "",
      description: "",
      status: "todo",
      completed: false,
    });
    setTaskDialogOpen(true);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Welcome to Self Flow</h1>
            <p className="text-muted-foreground">
              Sign in or create an account to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatSelectedDate = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "Invalid date";
    }
    try {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Week Calendar Widget - positioned below header */}
      <WeekCalendarWidget
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onOpenMonthCalendar={handleOpenMonthCalendar}
      />

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold">Daily Tasks</h1>
                <p className="text-sm sm:text-base text-muted-foreground truncate">
                  {formatSelectedDate(selectedDate)}
                </p>
              </div>
              <Button 
                onClick={handleCreateTask} 
                className="flex items-center gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Plus size={16} />
                Add Task
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading tasks...</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  Tasks ({dailyTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyTasks.length > 0 ? (
                  <div className="space-y-2">
                    {dailyTasks.map((task) => {
                      if (!task.id) {
                        console.warn("Task without ID found:", task);
                        return null;
                      }
                      return (
                        <TaskListItem
                          key={task.id}
                          task={task}
                          onEditTask={handleEditTask}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks for this date.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={handleCreateTask}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={taskFormData}
        onSaved={async () => {
          await fetchAllTasks();
          setTaskDialogOpen(false);
          setTaskFormData({
            title: "",
            description: "",
            status: "todo",
            completed: false,
          });
          setEditingTask(null);
          await refreshSubtasks();
        }}
      />

      {/* Month Calendar Dialog */}
      <MonthCalendarDialog
        open={monthCalendarOpen}
        onOpenChange={setMonthCalendarOpen}
        selectedDate={selectedDate}
        onDateSelect={handleMonthCalendarDateSelect}
      />
    </div>
  );
}

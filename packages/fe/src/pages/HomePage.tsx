import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import TaskDialog from "@/components/dialogs/TaskDialog";
import GoalFormDialog from "@/components/dialogs/GoalFormDialog";
import { TaskDTO, GoalDTO } from "@self-flow/common/types";
import { useSubtasks } from "@/contexts/SubtasksContext";
import WeekCalendarWidget from "@/components/common/WeekCalendarWidget";
import MonthCalendarDialog from "@/components/dialogs/MonthCalendarDialog";
import TaskListItem from "@/components/common/TaskListItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [goals, setGoals] = useState<GoalDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalDTO | null>(null);
  const [taskFormData, setTaskFormData] = useState<
    Partial<TaskDTO> & { goal_id?: string }
  >({
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
  const [goalsRefreshKey, setGoalsRefreshKey] = useState(0);
  const { refreshSubtasks } = useSubtasks();

  const fetchGoals = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await api.goals.list("active");
      setGoals(response.data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchGoals();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  // Find today's daily goal for the selected date
  const findTodaysDailyGoal = (date: Date): GoalDTO | null => {
    const dateStr = format(date, "yyyy-MM-dd");

    return (
      goals.find((goal) => {
        // Must be a Daily goal
        if (goal.category !== "Daily") return false;

        // Must be active
        if (goal.status !== "active") return false;

        // Check if date matches startDate/endDate
        // If no dates specified, it's always active
        if (!goal.startDate && !goal.endDate) return true;

        // If both dates exist, check if date is within range
        if (goal.startDate && goal.endDate) {
          return dateStr >= goal.startDate && dateStr <= goal.endDate;
        }

        // If only startDate, check if date is on or after startDate
        if (goal.startDate) {
          return dateStr >= goal.startDate;
        }

        // If only endDate, check if date is on or before endDate
        if (goal.endDate) {
          return dateStr <= goal.endDate;
        }

        return false;
      }) || null
    );
  };

  const todaysDailyGoal = useMemo(() => {
    if (!selectedDate || !(selectedDate instanceof Date)) return null;
    return findTodaysDailyGoal(selectedDate);
  }, [goals, selectedDate]);

  const dailyTasks = todaysDailyGoal?.tasks || [];

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
    const owningGoal =
      goals.find((goal) => goal.tasks?.some((t) => t.id === task.id)) || null;
    setTaskFormData({
      ...task,
      status: task.status || "todo",
      goal_id: owningGoal?.id,
    });
    setTaskDialogOpen(true);
  };

  const handleCreateTask = () => {
    setTaskFormData({
      title: "",
      description: "",
      status: "todo",
      completed: false,
      goal_id: todaysDailyGoal?.id,
    });
    setTaskDialogOpen(true);
  };

  const handleDailyTasksClick = () => {
    const todaysGoal = findTodaysDailyGoal(selectedDate);

    if (todaysGoal) {
      // Edit existing daily goal
      setEditingGoal(todaysGoal);
      setGoalDialogOpen(true);
    } else {
      // Create new daily goal for selected date
      setEditingGoal(null);
      setGoalDialogOpen(true);
    }
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

  const formatDateForGoalTitle = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "";
    }
    try {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      console.error("Error formatting date for goal title:", e);
      return "";
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Week Calendar Widget - positioned below header */}
      <WeekCalendarWidget
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onOpenMonthCalendar={handleOpenMonthCalendar}
        goalsRefreshKey={goalsRefreshKey}
      />

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <h1
                  className="text-xl sm:text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
                  onClick={handleDailyTasksClick}
                  title="Click to create or edit today's daily goal"
                >
                  Daily Tasks
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground truncate">
                  {(() => {
                    const todaysGoal = findTodaysDailyGoal(selectedDate);
                    return (
                      todaysGoal?.title || formatSelectedDate(selectedDate)
                    );
                  })()}
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
                  {todaysDailyGoal
                    ? `Tasks (${dailyTasks.length})`
                    : "No Daily Goal Yet"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyTasks.length > 0 ? (
                  <div className="space-y-2">
                    {dailyTasks
                      .filter((task) => task.id && typeof task.id === "string")
                      .map((task) => (
                        <TaskListItem
                          key={task.id!}
                          task={task}
                          onEditTask={handleEditTask}
                        />
                      ))}
                  </div>
                ) : todaysDailyGoal ? (
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No daily goal for this date yet.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={handleCreateTask}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add a task to create one
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
        createForDate={selectedDate}
        onSaved={async () => {
          await fetchGoals();
          setTaskDialogOpen(false);
          setTaskFormData({
            title: "",
            description: "",
            status: "todo",
            completed: false,
          });
          await refreshSubtasks();
          setGoalsRefreshKey((prev) => prev + 1);
        }}
      />

      {/* Month Calendar Dialog */}
      <MonthCalendarDialog
        open={monthCalendarOpen}
        onOpenChange={setMonthCalendarOpen}
        selectedDate={selectedDate}
        onDateSelect={handleMonthCalendarDateSelect}
      />

      {/* Goal Dialog */}
      <GoalFormDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        goal={editingGoal}
        initialDate={editingGoal ? undefined : selectedDate}
        initialTitle={
          editingGoal ? undefined : formatDateForGoalTitle(selectedDate)
        }
        onSaved={async () => {
          await fetchGoals();
          setGoalDialogOpen(false);
          setEditingGoal(null);
          setGoalsRefreshKey((prev) => prev + 1);
        }}
      />
    </div>
  );
}

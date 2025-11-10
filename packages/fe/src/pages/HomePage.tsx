import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import moveElement from "@/helpers/moveElement";

const KANBAN_COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "completed", label: "Completed" },
] as const;

type KanbanColumnKey = (typeof KANBAN_COLUMNS)[number]["key"];

const mapStatusToColumn = (
  status: TaskDTO["status"] | null | undefined
): KanbanColumnKey => {
  switch (status) {
    case "in progress":
    case "blocked":
      return status;
    case "completed":
    case "not done":
      return "completed";
    case "todo":
    case null:
    default:
      return "todo";
  }
};

const columnKeyToStatus = (column: KanbanColumnKey): TaskDTO["status"] => {
  switch (column) {
    case "in progress":
    case "blocked":
      return column;
    case "completed":
      return "completed";
    case "todo":
    default:
      return "todo";
  }
};

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
  const [activeTab, setActiveTab] = useState<"list" | "kanban">("list");

  const fetchGoals = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (user && !loading) {
      fetchGoals();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
  }, [user, loading, fetchGoals]);

  // Find today's daily goal for the selected date
  const findTodaysDailyGoal = useCallback(
    (date: Date): GoalDTO | null => {
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
    },
    [goals]
  );

  const todaysDailyGoal = useMemo(() => {
    if (!selectedDate || !(selectedDate instanceof Date)) return null;
    return findTodaysDailyGoal(selectedDate);
  }, [selectedDate, findTodaysDailyGoal]);

  const dailyTasks = useMemo(
    () =>
      (todaysDailyGoal?.tasks || []).slice().sort((a, b) => {
        const aIndex = a?.orderIndex ?? 0;
        const bIndex = b?.orderIndex ?? 0;
        return aIndex - bIndex;
      }),
    [todaysDailyGoal]
  );

  const tasksByColumn = useMemo(() => {
    const initial = KANBAN_COLUMNS.reduce(
      (acc, column) => {
        acc[column.key] = [];
        return acc;
      },
      {} as Record<KanbanColumnKey, TaskDTO[]>
    );

    for (const task of dailyTasks) {
      const key = mapStatusToColumn(task.status ?? null);
      initial[key].push(task);
    }

    (Object.keys(initial) as KanbanColumnKey[]).forEach((key) => {
      initial[key].sort((a, b) => (a?.orderIndex ?? 0) - (b?.orderIndex ?? 0));
    });

    return initial;
  }, [dailyTasks]);

  const handleTaskDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!todaysDailyGoal || !destination) {
        return;
      }

      const isListDrag =
        source.droppableId === "daily-task-list" &&
        destination.droppableId === "daily-task-list";
      const isKanbanDrag =
        source.droppableId.startsWith("kanban-") &&
        destination.droppableId.startsWith("kanban-");

      if (!isListDrag && !isKanbanDrag) {
        return;
      }

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      let reorderedTasks: TaskDTO[] | null = null;
      let updatedStatusPayload: {
        status: TaskDTO["status"];
        completed: boolean;
      } | null = null;

      setGoals((prevGoals) =>
        prevGoals.map((goal) => {
          if (goal.id !== todaysDailyGoal.id) {
            return goal;
          }

          const tasksForGoal = goal.tasks ? [...goal.tasks] : [];

          if (tasksForGoal.length === 0) {
            return goal;
          }

          if (isListDrag) {
            try {
              const moved = moveElement(
                tasksForGoal,
                source.index,
                destination.index
              );
              reorderedTasks = moved.map((task, index) => ({
                ...task,
                orderIndex: index,
              }));
              return {
                ...goal,
                tasks: reorderedTasks,
              };
            } catch (error) {
              console.error("Error reordering tasks locally:", error);
              reorderedTasks = null;
              return goal;
            }
          }

          if (isKanbanDrag) {
            const sourceColumn = source.droppableId.replace(
              "kanban-",
              ""
            ) as KanbanColumnKey;
            const destinationColumn = destination.droppableId.replace(
              "kanban-",
              ""
            ) as KanbanColumnKey;

            const columnTasks = KANBAN_COLUMNS.reduce(
              (acc, column) => {
                acc[column.key] = [] as TaskDTO[];
                return acc;
              },
              {} as Record<KanbanColumnKey, TaskDTO[]>
            );

            for (const task of tasksForGoal) {
              if (!task.id || typeof task.id !== "string") {
                continue;
              }
              const key = mapStatusToColumn(task.status ?? null);
              columnTasks[key].push(task);
            }

            let movedTask: TaskDTO | undefined;

            if (sourceColumn === destinationColumn) {
              try {
                columnTasks[sourceColumn] = moveElement(
                  columnTasks[sourceColumn],
                  source.index,
                  destination.index
                );
                movedTask = columnTasks[sourceColumn][destination.index];
              } catch (error) {
                console.error("Error reordering Kanban column:", error);
                return goal;
              }
            } else {
              const [removedTask] = columnTasks[sourceColumn].splice(
                source.index,
                1
              );

              if (!removedTask) {
                console.warn("Moved task not found in source column");
                return goal;
              }

              const nextStatus = columnKeyToStatus(destinationColumn);
              const nextCompleted = destinationColumn === "completed";

              movedTask = {
                ...removedTask,
                status: nextStatus,
                completed: nextCompleted,
              };

              columnTasks[destinationColumn].splice(
                destination.index,
                0,
                movedTask
              );

              updatedStatusPayload = {
                status: nextStatus,
                completed: nextCompleted,
              };
            }

            if (!movedTask) {
              console.warn("No task moved during Kanban drag operation");
              return goal;
            }

            const recombined = KANBAN_COLUMNS.flatMap(
              (column) => columnTasks[column.key]
            );

            reorderedTasks = recombined.map((task, index) => {
              const baseTask =
                movedTask && task.id === movedTask.id ? movedTask : task;
              return {
                ...baseTask,
                orderIndex: index,
              };
            });

            return {
              ...goal,
              tasks: reorderedTasks,
            };
          }

          return goal;
        })
      );

      if (!reorderedTasks) {
        return;
      }

      const tasksToReorder = reorderedTasks as TaskDTO[];
      const statusPayload = updatedStatusPayload;

      try {
        if (statusPayload && draggableId && typeof draggableId === "string") {
          await api.tasks.update(draggableId, statusPayload);
        }

        const reorderPayload: Array<{ taskId: string; orderIndex: number }> =
          [];

        tasksToReorder.forEach((task: TaskDTO, index: number) => {
          if (typeof task.id === "string") {
            reorderPayload.push({
              taskId: task.id,
              orderIndex: index,
            });
          }
        });

        if (reorderPayload.length > 0) {
          await api.tasks.reorder(reorderPayload);
        }

        setGoalsRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Error updating task order/status after drag:", error);
        await fetchGoals();
      }
    },
    [fetchGoals, todaysDailyGoal]
  );

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

  const handleTaskStatusChange = useCallback(
    (taskId: string, status: TaskDTO["status"], completed: boolean) => {
      setGoals((prevGoals) =>
        prevGoals.map((goal) => {
          if (!goal.tasks) {
            return goal;
          }

          if (!goal.tasks.some((task) => task.id === taskId)) {
            return goal;
          }

          return {
            ...goal,
            tasks: goal.tasks.map((task) =>
              task.id === taskId ? { ...task, status, completed } : task
            ),
          };
        })
      );
    },
    []
  );

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
        <div className="max-w-6xl mx-auto">
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
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "list" | "kanban")
                  }
                >
                  <TabsList className="mb-4">
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="kanban">Kanban</TabsTrigger>
                  </TabsList>

                  <TabsContent value="list">
                    {dailyTasks.length > 0 ? (
                      <DragDropContext onDragEnd={handleTaskDragEnd}>
                        <Droppable droppableId="daily-task-list">
                          {(provided) => (
                            <div
                              className="space-y-2"
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              {dailyTasks
                                .filter(
                                  (task) =>
                                    task.id && typeof task.id === "string"
                                )
                                .map((task, index) => (
                                  <Draggable
                                    key={task.id!}
                                    draggableId={task.id!}
                                    index={index}
                                  >
                                    {(dragProvided, snapshot) => (
                                      <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={`rounded transition-shadow ${
                                          snapshot.isDragging
                                            ? "shadow-lg bg-muted"
                                            : ""
                                        }`}
                                      >
                                        <TaskListItem
                                          task={task}
                                          onEditTask={handleEditTask}
                                          onStatusChange={
                                            handleTaskStatusChange
                                          }
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
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
                  </TabsContent>

                  <TabsContent value="kanban">
                    {dailyTasks.length > 0 ? (
                      <DragDropContext onDragEnd={handleTaskDragEnd}>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {KANBAN_COLUMNS.map((column) => (
                            <Droppable
                              key={column.key}
                              droppableId={`kanban-${column.key}`}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`border rounded-lg p-1 bg-muted/40 transition-colors ${
                                    snapshot.isDraggingOver
                                      ? "border-primary/70 bg-background"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold">
                                      {column.label}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                      {tasksByColumn[column.key].length}
                                    </span>
                                  </div>
                                  <div className="space-y-2 min-h-[80px]">
                                    {tasksByColumn[column.key]
                                      .filter(
                                        (task) =>
                                          task.id && typeof task.id === "string"
                                      )
                                      .map((task, index) => (
                                        <Draggable
                                          key={task.id as string}
                                          draggableId={task.id as string}
                                          index={index}
                                        >
                                          {(dragProvided, dragSnapshot) => (
                                            <div
                                              ref={dragProvided.innerRef}
                                              {...dragProvided.draggableProps}
                                              {...dragProvided.dragHandleProps}
                                              className={`border rounded-lg bg-background shadow-sm transition-shadow ${
                                                dragSnapshot.isDragging
                                                  ? "shadow-lg border-primary"
                                                  : ""
                                              }`}
                                            >
                                              <TaskListItem
                                                task={task}
                                                onEditTask={handleEditTask}
                                                onStatusChange={
                                                  handleTaskStatusChange
                                                }
                                                hiddenInfos={[
                                                  "status",
                                                  "effort",
                                                  "priority",
                                                ]}
                                              />
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                    {tasksByColumn[column.key].length === 0 && (
                                      <p className="text-xs text-muted-foreground text-center py-4">
                                        No tasks
                                      </p>
                                    )}
                                    {provided.placeholder}
                                  </div>
                                </div>
                              )}
                            </Droppable>
                          ))}
                        </div>
                      </DragDropContext>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No tasks available to display.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
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

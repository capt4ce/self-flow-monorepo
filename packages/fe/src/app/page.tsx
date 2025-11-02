"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import GoalCard from "@/components/common/GoalCard";
import GoalFormDialog from "@/components/dialogs/GoalFormDialog";
import TaskDialog from "@/components/dialogs/TaskDialog";
import { GoalDTO, GoalCategory, GoalStatus } from "@self-flow/common/types";
import { TaskDTO } from "@self-flow/common/types";
import TaskGroupDialog from "@/components/dialogs/TaskGroupDialog";
import { TaskGroupDTO } from "@self-flow/common/types";
import { useSubtasks } from "@/contexts/SubtasksContext";

export default function Home() {
  const { user, loading } = useAuth();
  const [goals, setGoals] = useState<GoalDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalDTO | null>(null);
  const [taskFormData, setTaskFormData] = useState<Partial<TaskDTO> & { goal_id?: string }>({
    title: "",
    description: "",
    status: "todo",
    completed: false,
  });
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TaskGroupDTO | null>(null);
  const [currentGoalId, setCurrentGoalId] = useState<string>("");
  const { refreshSubtasks } = useSubtasks();

  useEffect(() => {
    if (user && !loading) {
      fetchGoals();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
  }, [user, loading]);

  const fetchGoals = async () => {
    try {
      const response = await api.goals.list("active");
      setGoals(response.data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTaskGroup = async (goalId: string) => {
    setCurrentGoalId(goalId);
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  const handleEditTaskGroup = async (groupId: string) => {
    const goal = goals.find((g) =>
      g.taskGroups?.some((tg) => tg.id === groupId)
    );
    const group = goal?.taskGroups?.find((tg) => tg.id === groupId);
    if (group) {
      setCurrentGoalId(goal!.id);
      setEditingGroup(group);
      setGroupDialogOpen(true);
    }
  };

  const handleDeleteTaskGroup = async (groupId: string) => {
    if (!user) return;

    try {
      await api.taskGroups.delete(groupId);
      await fetchGoals();
    } catch (error) {
      console.error("Error deleting task group:", error);
    }
  };

  const handleSaveTaskGroup = async (title: string) => {
    if (!user || !currentGoalId) return;

    try {
      if (editingGroup) {
        await api.taskGroups.update(editingGroup.id, { title });
      } else {
        await api.taskGroups.create({
          title,
          goalId: currentGoalId,
        });
      }

      await fetchGoals();
    } catch (error) {
      console.error("Error saving task group:", error);
      throw error;
    }
  };

  const handleMoveTaskToGroup = async (
    taskId: string,
    groupId: string | null
  ) => {
    if (!user) return;

    try {
      await api.tasks.update(taskId, { groupId });
      await fetchGoals();
    } catch (error) {
      console.error("Error moving task to group:", error);
    }
  };

  const allCategories: GoalCategory[] = [
    "Main",
    "Yearly",
    "Quarterly",
    "Monthly",
    "Weekly",
    "Daily",
  ];

  const groupedGoals = allCategories.reduce((acc, category) => {
    acc[category] = goals.filter((goal) => goal.category === category);
    return acc;
  }, {} as Record<GoalCategory, GoalDTO[]>);

  const resetGoalForm = () => {
    setEditingGoal(null);
  };

  const handleEditGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setEditingGoal(goal);
      setGoalDialogOpen(true);
    }
  };

  const handleOpenGoalDialog = (category?: GoalCategory) => {
    resetGoalForm();
    setEditingGoal(category ? ({ category } as any) : null);
    setGoalDialogOpen(true);
  };

  const handleEditTask = (task: TaskDTO) => {
    setTaskFormData({
      ...task,
      status: task.status || "todo",
      goal_id: goals.find((g) => g.tasks?.some((t) => t.id === task.id))?.id,
    });
    setTaskDialogOpen(true);
  };

  const handleAddTask = async (goalId: string, parentId?: string) => {
    if (!user) return;

    setTaskFormData({
      title: "",
      description: "",
      status: "todo",
      completed: false,
      goal_id: goalId,
      parentId: parentId,
    });
    setTaskDialogOpen(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;

    try {
      await api.goals.delete(goalId);
      setGoals(goals.filter((goal) => goal.id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const updateGoalTasks = (goalId: string, tasks: TaskDTO[]) => {
    const newGoals = [...goals];
    newGoals.forEach((goal) => {
      if (goal.id !== goalId) {
        return;
      }
      goal.tasks = tasks;
    });
    setGoals(newGoals);
  };

  const handleDeleteTask = async (goalId: string, taskId: string) => {
    if (!user) return;

    try {
      await api.tasks.delete(taskId);
      setGoals(
        goals.map((goal) => {
          if (goal.id === goalId) {
            return {
              ...goal,
              tasks: (goal.tasks || []).filter((t) => t.id !== taskId),
            };
          }
          return goal;
        })
      );
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleToggleGoalStatus = async (goalId: string, currentStatus: GoalStatus) => {
    if (!user) return;

    try {
      const newStatus = currentStatus === "active" ? "done" : "active";
      await api.goals.update(goalId, { status: newStatus });
      await fetchGoals();
    } catch (error) {
      console.error("Error toggling goal status:", error);
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

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your goals and progress
            </p>
          </div>
          <Button
            onClick={() => handleOpenGoalDialog()}
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Add Goal
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedGoals).map(([category, categoryGoals]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-muted-foreground">
                  {category}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenGoalDialog(category as GoalCategory)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {category} Goal
                </Button>
              </div>

              {categoryGoals.length > 0 ? (
                <div
                  style={{
                    padding: "4px",
                  }}
                  className="border-gray-200 border-2 rounded-lg"
                >
                  {categoryGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={handleEditGoal}
                      onDelete={handleDeleteGoal}
                      onAddTask={handleAddTask}
                      onEditTask={handleEditTask}
                      onCreateTaskGroup={handleCreateTaskGroup}
                      onEditTaskGroup={handleEditTaskGroup}
                      onDeleteTaskGroup={handleDeleteTaskGroup}
                      onMoveTaskToGroup={handleMoveTaskToGroup}
                      onToggleGoalStatus={handleToggleGoalStatus}
                      showTasks={true}
                      showProgress={true}
                      compact={false}
                      updateGoalTasks={updateGoalTasks}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  No {category.toLowerCase()} goals yet.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Unified Goal Dialog */}
      <GoalFormDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        goal={editingGoal}
        onSaved={() => {
          fetchGoals();
          resetGoalForm();
        }}
      />

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={taskFormData}
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
        }}
      />

      {/* Task Group Dialog */}
      <TaskGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        group={editingGroup}
        onSave={handleSaveTaskGroup}
      />
    </div>
  );
}

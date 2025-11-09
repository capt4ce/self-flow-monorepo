import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import GoalCard from "@/components/common/GoalCard";
import { GoalDTO, GoalStatus } from "@self-flow/common/types";
import { TaskDTO } from "@self-flow/common/types";
import GoalFormDialog from "@/components/dialogs/GoalFormDialog";
import TaskDialog from "@/components/dialogs/TaskDialog";
import TaskGroupDialog from "@/components/dialogs/TaskGroupDialog";
import { TaskGroupDTO } from "@self-flow/common/types";
import { api } from "@/lib/api-client";
import { useSubtasks } from "@/contexts/SubtasksContext";

export default function GoalsPage() {
  const { user } = useAuth();
  const { refreshSubtasks } = useSubtasks();
  const [goals, setGoals] = useState<GoalDTO[]>([]);
  const [filter, setFilter] = useState<GoalStatus>("active");
  const [loading, setLoading] = useState(true);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalDTO | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState<
    Partial<TaskDTO> & { goal_id?: string }
  >({
    title: "",
    description: "",
    status: "todo",
    completed: false,
  });
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TaskGroupDTO | null>(null);
  const [currentGoalId, setCurrentGoalId] = useState<string>("");

  const fetchGoals = async () => {
    try {
      const response = await api.goals.list(filter);
      setGoals(response.data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const handleToggleGoalStatus = async (
    goalId: string,
    currentStatus: GoalStatus
  ) => {
    if (!user) return;

    try {
      const newStatus = currentStatus === "active" ? "done" : "active";
      await api.goals.update(goalId, { status: newStatus });
      await fetchGoals();
    } catch (error) {
      console.error("Error toggling goal status:", error);
    }
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

  const handleEditGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setEditingGoal(goal);
      setGoalDialogOpen(true);
    }
  };

  const handleOpenGoalDialog = () => {
    setEditingGoal(null);
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
      await api.tasks.update(taskId, { groupId: groupId ?? undefined });
      await fetchGoals();
    } catch (error) {
      console.error("Error moving task to group:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">All Goals</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View and manage all your goals
            </p>
          </div>
          <Button
            onClick={handleOpenGoalDialog}
            className="w-full sm:w-auto"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>

        <div className="flex gap-2 mb-4 sm:mb-6">
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            Active
          </Button>
          <Button
            variant={filter === "done" ? "default" : "outline"}
            onClick={() => setFilter("done")}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            Done
          </Button>
        </div>

        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading goals...</p>
            </div>
          ) : goals.length > 0 ? (
            goals.map((goal) => (
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
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No {filter} goals found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Goal Dialog */}
      <GoalFormDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        goal={editingGoal}
        onSaved={() => {
          fetchGoals();
          setGoalDialogOpen(false);
          setEditingGoal(null);
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


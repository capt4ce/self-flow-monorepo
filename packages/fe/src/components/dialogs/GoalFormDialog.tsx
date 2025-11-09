"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import RichTextEditor from "@/components/RichTextEditor";
import { format } from "date-fns";
import { GoalDTO, GoalCategory, GoalStatus } from "@self-flow/common/types";
import { TaskDTO, TaskEffort, TaskStatus } from "@self-flow/common/types";
import { getStatusBadgeColor, getEffortBadgeColor } from "@/utils/badgeColors";
import TaskSearch from "../common/TaskSearch";
import TaskAutocomplete from "../common/TaskAutocomplete";
import { api } from "@/lib/api-client";

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalDTO | null;
  onSaved: () => void;
}

const GoalFormDialog: React.FC<GoalFormDialogProps> = ({
  open,
  onOpenChange,
  goal,
  onSaved,
}) => {
  const isEditing = !!goal?.id;
  const { user } = useAuth();
  const [goalFormData, setGoalFormData] = useState({
    title: "",
    description: "",
    category: "Daily" as GoalCategory,
    status: "active" as GoalStatus,
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [newTasks, setNewTasks] = useState<
    Array<{
      title: string;
      description: string;
      status: string;
      effort?: TaskEffort;
      templateId?: string;
    }>
  >([]);
  const [selectedExistingTaskIds, setSelectedExistingTaskIds] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [goalTasks, setGoalTasks] = useState<TaskDTO[]>([]);

  useEffect(() => {
    if (goal) {
      setGoalFormData({
        title: goal.title || "",
        description: goal.description || "",
        category: goal.category || "Daily",
        status: goal.status || "active",
        startDate: goal.startDate
          ? format(new Date(goal.startDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        endDate: goal.endDate
          ? format(new Date(goal.endDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
      });
      setGoalTasks(goal.tasks || []);
      setSelectedExistingTaskIds((goal.tasks || []).map((t: TaskDTO) => t.id));
    } else {
      resetForm();
    }
  }, [goal]);

  const resetForm = () => {
    setGoalFormData({
      title: "",
      description: "",
      category: "Daily",
      status: "active",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    });
    setNewTasks([]);
    setSelectedExistingTaskIds([]);
    setGoalTasks([]);
  };

  const handleSaveGoal = async () => {
    if (goalFormData.title.trim() === "" || !user) return;

    setLoading(true);
    try {
      const goalData = {
        title: goalFormData.title,
        description: goalFormData.description || undefined,
        category: goalFormData.category,
        status: goalFormData.status,
        startDate: goalFormData.startDate || undefined,
        endDate: goalFormData.endDate || undefined,
      };

      if (goal?.id) {
        // Update goal with tasks (batch operation)
        const tasksToAdd = newTasks.filter((t) => t.title.trim() !== "");
        await api.goals.update(goal.id, {
          ...goalData,
          newTasks:
            tasksToAdd.length > 0
              ? tasksToAdd.map((t) => ({
                  title: t.title,
                  description: t.description || undefined,
                  effort: t.effort || undefined,
                  status: (t.status as TaskStatus) || "todo",
                  templateId: t.templateId || undefined,
                }))
              : undefined,
          selectedTaskIds: selectedExistingTaskIds,
          currentTaskIds: goalTasks.map((t: TaskDTO) => t.id),
        });
      } else {
        // Create goal with tasks (batch operation)
        const tasksToAdd = newTasks.filter((t) => t.title.trim() !== "");
        await api.goals.create({
          ...goalData,
          newTasks:
            tasksToAdd.length > 0
              ? tasksToAdd.map((t) => ({
                  title: t.title,
                  description: t.description || undefined,
                  effort: t.effort || undefined,
                  status: (t.status as TaskStatus) || "todo",
                  templateId: t.templateId || undefined,
                }))
              : undefined,
          existingTaskIds:
            selectedExistingTaskIds.length > 0
              ? selectedExistingTaskIds
              : undefined,
        });
      }

      resetForm();
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("Error saving goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (goalFormData.title.trim() === "") return;
    await handleSaveGoal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={handleKeyDown}
        className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full"
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? "Edit Goal" : "Create New Goal"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-title" className="text-sm sm:text-base">Title</Label>
              <Input
                id="goal-title"
                value={goalFormData.title}
                onChange={(e) =>
                  setGoalFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Enter goal title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-category" className="text-sm sm:text-base">Category</Label>
              <Select
                value={goalFormData.category}
                onValueChange={(value) =>
                  setGoalFormData((prev) => ({
                    ...prev,
                    category: value as GoalCategory,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main">Main</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-status" className="text-sm sm:text-base">Status</Label>
              <Select
                value={goalFormData.status}
                onValueChange={(value) =>
                  setGoalFormData((prev) => ({
                    ...prev,
                    status: value as GoalStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-start-date" className="text-sm sm:text-base">Start Date</Label>
              <Input
                id="goal-start-date"
                type="date"
                value={goalFormData.startDate}
                onChange={(e) =>
                  setGoalFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-end-date" className="text-sm sm:text-base">End Date</Label>
              <Input
                id="goal-end-date"
                type="date"
                value={goalFormData.endDate}
                onChange={(e) =>
                  setGoalFormData((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">Description</Label>
            <RichTextEditor
              value={goalFormData.description}
              onChange={(value) =>
                setGoalFormData((prev) => ({ ...prev, description: value }))
              }
            />
          </div>

          {/* Current Tasks in Goal */}
          {goal && goalTasks.length > 0 && (
            <div className="space-y-2">
              <Label>Current Tasks in this Goal</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-3">
                {goalTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedExistingTaskIds.includes(task.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedExistingTaskIds((prev) => [
                            ...prev,
                            task.id,
                          ]);
                        } else {
                          setSelectedExistingTaskIds((prev) =>
                            prev.filter((id) => id !== task.id)
                          );
                        }
                      }}
                    />
                    <span
                      className={`flex-1 text-sm cursor-pointer hover:text-blue-600 ${
                        task.completed ? "line-through text-gray-500" : ""
                      } ${
                        task.status === "not done"
                          ? "line-through text-red-500"
                          : ""
                      }`}
                    >
                      {task.title}
                    </span>
                    <div className="flex gap-1">
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
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Uncheck tasks to remove them from this goal
              </p>
            </div>
          )}

          {/* Quick Add Tasks Section */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Quick Add Tasks</Label>
            <div className="p-2 border rounded-lg">
              <TaskAutocomplete
                label="Duplicate Task from Template"
                onTasksSelected={(tasks) => {
                  const newTasksToAdd = tasks.map((task) => ({
                    title: task.title,
                    description: task.description || "",
                    effort: task.effort || undefined,
                    status: "todo",
                    templateId: task.id,
                  }));
                  setNewTasks((prev) => [...prev, ...newTasksToAdd]);
                }}
              />
              <div className="space-y-2 mt-2">
                {newTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-2 border rounded"
                  >
                    <Input
                      placeholder="Task title"
                      value={task.title}
                      onChange={(e) => {
                        const updated = [...newTasks];
                        updated[index].title = e.target.value;
                        setNewTasks(updated);
                      }}
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Select
                        value={task.effort || ""}
                        onValueChange={(value) => {
                          const updated = [...newTasks];
                          updated[index].effort = value as TaskEffort;
                          setNewTasks(updated);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-20">
                          <SelectValue placeholder="Effort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="med">Med</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => {
                          const updated = newTasks.filter((_, i) => i !== index);
                          setNewTasks(updated);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setNewTasks([
                      ...newTasks,
                      { title: "", description: "", status: "todo" },
                    ])
                  }
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>
          </div>

          <TaskSearch
            label="Add Existing Tasks"
            selectedExistingTaskIds={selectedExistingTaskIds}
            setSelectedExistingTaskIds={setSelectedExistingTaskIds}
          />

          <Button onClick={handleSave} className="w-full" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update Goal" : "Create Goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalFormDialog;

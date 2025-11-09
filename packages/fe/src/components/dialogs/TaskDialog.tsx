"use client";

import React, { useState } from "react";
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
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextEditor from "@/components/RichTextEditor";
import {
  TaskDTO,
  TaskEffort,
  TaskStatus,
  TaskPriority,
  CreateTaskDTO,
  UpdateTaskDTO,
} from "@self-flow/common/types";
import { Badge } from "../ui/badge";
import { getEffortBadgeColor, getStatusBadgeColor } from "@/utils/badgeColors";
import TaskSearch from "../common/TaskSearch";
import ParentTaskSearch from "../common/ParentTaskSearch";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: (Partial<TaskDTO> & { goal_id?: string }) | null;
  onSaved?: () => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  onOpenChange,
  task,
  onSaved,
}) => {
  const { user } = useAuth();
  const [taskFormData, setTaskFormData] = useState<Partial<TaskDTO> & { goal_id?: string; ai_agent?: string; ai_prompt?: string }>(
    task ? {
      ...task,
      goal_id: task.goal_id,
      ai_agent: "none",
      ai_prompt: "",
    } : {
      title: "",
      description: "",
      status: "todo",
      completed: false,
      goal_id: undefined,
      ai_agent: "none",
      ai_prompt: "",
    }
  );
  const [newTasks, setNewTasks] = useState<
    Array<{ title: string; description: string; status: string; effort?: TaskEffort; priority?: TaskPriority }>
  >([]);
  const [selectedExistingTaskIds, setSelectedExistingTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<TaskDTO[]>([]);

  const resetForm = () => {
    setTaskFormData({
      title: "",
      description: "",
      status: "todo",
      completed: false,
      goal_id: task?.goal_id,
      ai_agent: "none",
      ai_prompt: "",
    });
    setNewTasks([]);
    setSelectedExistingTaskIds([]);
    setSubtasks([]);
  };

  React.useEffect(() => {
    if (task) {
      setTaskFormData({ ...task, goal_id: task.goal_id });
      if (task.id) {
        const fetchSubtasks = async () => {
          try {
            const data = await api.tasks.listSubtasks([task.id!]);
            setSubtasks(data[task.id!] || []);
          } catch (error) {
            console.error("Error fetching subtasks:", error);
          }
        };
        fetchSubtasks();
      }
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  const handleSave = async () => {
    if (!user || !taskFormData.title?.trim()) return;

    setLoading(true);
    try {
      const title = taskFormData.title;
      if (!title) return;
      
      const taskDataToSave: CreateTaskDTO | UpdateTaskDTO = {
        title,
        description: taskFormData.description || undefined,
        effort: taskFormData.effort || undefined,
        status: (taskFormData.status as TaskStatus) || "todo",
        priority: taskFormData.priority || undefined,
        parentId: taskFormData.parentId || undefined,
        goalId: taskFormData.goal_id || undefined,
        groupId: taskFormData.groupId || undefined,
        isTemplate: taskFormData.isTemplate || false,
        completed: taskFormData.completed || false,
        orderIndex: taskFormData.orderIndex || 0,
      };

      if (taskFormData?.id) {
        // Update task with subtasks (batch operation)
        const subtasksToAdd = newTasks.filter((t) => t.title.trim() !== "");
        await api.tasks.update(taskFormData.id, {
          ...taskDataToSave,
          newSubtasks: subtasksToAdd.length > 0
            ? subtasksToAdd.map((st) => ({
                title: st.title,
                description: st.description || undefined,
                effort: st.effort || undefined,
                priority: st.priority || undefined,
                status: (st.status as TaskStatus) || "todo",
                goalId: taskFormData.goal_id || undefined,
              }))
            : undefined,
          selectedSubtaskIds: selectedExistingTaskIds,
          currentSubtaskIds: subtasks.map((st) => st.id!),
        });
      } else {
        // Create task with subtasks (batch operation)
        const subtasksToAdd = newTasks.filter((t) => t.title.trim() !== "");
        const createData = {
          title,
          description: taskDataToSave.description,
          effort: taskDataToSave.effort,
          status: taskDataToSave.status,
          priority: taskDataToSave.priority,
          parentId: taskDataToSave.parentId,
          goalId: taskDataToSave.goalId,
          groupId: taskDataToSave.groupId,
          isTemplate: taskDataToSave.isTemplate,
          completed: taskDataToSave.completed,
          orderIndex: taskDataToSave.orderIndex,
          newSubtasks: subtasksToAdd.length > 0
            ? subtasksToAdd.map((st) => ({
                title: st.title,
                description: st.description || undefined,
                effort: st.effort || undefined,
                priority: st.priority || undefined,
                status: (st.status as TaskStatus) || "todo",
                goalId: taskFormData.goal_id || undefined,
              }))
            : undefined,
          existingSubtaskIds: selectedExistingTaskIds.length > 0 ? selectedExistingTaskIds : undefined,
        };
        await api.tasks.create(createData);
      }

      if (typeof onSaved === "function") {
        onSaved();
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setLoading(false);
    }
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
        className="max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full"
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {taskFormData?.id ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={taskFormData.title || ""}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, title: e.target.value })
                }
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={taskFormData.status || "todo"}
                onValueChange={(value) =>
                  setTaskFormData({
                    ...taskFormData,
                    status: value as TaskStatus,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="not done">Not Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-effort">Effort Level</Label>
            <Select
              value={taskFormData.effort || ""}
              onValueChange={(value) =>
                setTaskFormData({
                  ...taskFormData,
                  effort: value as TaskEffort,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select effort level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="med">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-priority">Priority</Label>
            <Select
              value={taskFormData.priority || ""}
              onValueChange={(value) =>
                setTaskFormData({
                  ...taskFormData,
                  priority: value as TaskPriority,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="med">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-template"
              checked={taskFormData.isTemplate || false}
              onCheckedChange={(checked: boolean) =>
                setTaskFormData({ ...taskFormData, isTemplate: checked })
              }
            />
            <Label htmlFor="is-template">Mark as Template</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <RichTextEditor
              value={taskFormData.description || ""}
              onChange={(value) =>
                setTaskFormData({ ...taskFormData, description: value })
              }
            />
          </div>

          {/* Existing Subtasks */}
          {subtasks.length > 0 && (
            <div className="space-y-2">
              <Label>Subtasks</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-3">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-2">
                    <span
                      className={`flex-1 text-sm cursor-pointer hover:text-blue-600 ${
                        subtask.completed ? "line-through text-gray-500" : ""
                      } ${
                        subtask.status === "not done"
                          ? "line-through text-red-500"
                          : ""
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <div className="flex gap-1">
                      {subtask.status && (
                        <Badge
                          className={`text-xs ${getStatusBadgeColor(
                            subtask.status
                          )}`}
                        >
                          {subtask.status}
                        </Badge>
                      )}
                      {subtask.effort && (
                        <Badge
                          className={`text-xs ${getEffortBadgeColor(
                            subtask.effort
                          )}`}
                        >
                          {subtask.effort}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Add Subtasks Section */}
          <div className="space-y-2">
            <Label>Quick Add Subtasks</Label>
            <div className="space-y-2">
              {newTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-2 border rounded"
                >
                  <Input
                    placeholder="Subtask title"
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
                    <Select
                      value={task.priority || ""}
                      onValueChange={(value) => {
                        const updated = [...newTasks];
                        updated[index].priority = value as TaskPriority;
                        setNewTasks(updated);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-20">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="med">Medium</SelectItem>
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
                Add Subtask
              </Button>
            </div>
          </div>

          <ParentTaskSearch
            label="Parent Task"
            selectedParentId={taskFormData.parentId || undefined}
            setSelectedParentId={(id) =>
              setTaskFormData({ ...taskFormData, parentId: id || undefined })
            }
            currentTaskId={taskFormData.id}
          />

          <TaskSearch
            label="Add Existing Tasks as Subtasks"
            selectedExistingTaskIds={selectedExistingTaskIds}
            setSelectedExistingTaskIds={setSelectedExistingTaskIds}
          />

          <Button
            onClick={handleSave}
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : taskFormData?.id
              ? "Save Changes"
              : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(TaskDialog);


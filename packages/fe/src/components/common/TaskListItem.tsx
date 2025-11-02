"use client";

import { TaskDTO } from "@self-flow/common/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import {
  getEffortBadgeColor,
  getPriorityBadgeColor,
  getStatusBadgeColor,
} from "@/utils/badgeColors";
import { useSubtasks } from "@/contexts/SubtasksContext";
import { api } from "@/lib/api-client";

type TaskListItemProps = {
  task: TaskDTO;
  level?: number;
  onEditTask: (task: TaskDTO) => void;
};

const TaskListItem = ({
  task,
  level = 0,
  onEditTask,
}: TaskListItemProps) => {
  const [checked, setChecked] = useState(
    task.completed || ["completed", "not done"].includes(task.status || "")
  );

  const { subtasks: subtasksCache, fetchTaskSubtasks } = useSubtasks();

  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
    fetchTaskSubtasks(task.id);
  }, [setIsExpanded, isExpanded, fetchTaskSubtasks, task]);

  const hasSubtasks = task.subtaskCount && task.subtaskCount > 0;
  const cachedSubtasks = subtasksCache?.[task.id] || [];

  const toggleTaskComplete = async (task: TaskDTO, completed: boolean) => {
    try {
      await api.tasks.update(task.id, { completed });
      setChecked(completed);
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  return (
    <div key={task.id} className={`${level > 0 ? "ml-6" : ""}`}>
      <div className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
        <div className="flex items-center gap-1">
          {!!hasSubtasks && (
            <button
              onClick={toggleExpand}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}
          {!hasSubtasks && <div className="w-5" />}
        </div>
        <Checkbox
          checked={checked}
          onCheckedChange={(checked) => toggleTaskComplete(task, !!checked)}
          className="flex-shrink-0"
        />
        <span
          className={`flex-1 text-sm cursor-pointer hover:text-blue-600 ${
            checked ? "line-through text-gray-500" : ""
          } ${task.status === "not done" ? "line-through text-red-500" : ""}`}
          onClick={() => onEditTask?.(task)}
        >
          {task.title}
        </span>
        <div className="flex gap-1">
          {task.isTemplate && <Badge>Template</Badge>}
          {task.status && (
            <Badge className={`text-xs ${getStatusBadgeColor(task.status)}`}>
              {task.status}
            </Badge>
          )}
          {task.effort && (
            <Badge className={`text-xs ${getEffortBadgeColor(task.effort)}`}>
              {task.effort}
            </Badge>
          )}
          {task.priority && (
            <Badge
              className={`text-xs ${getPriorityBadgeColor(task.priority)}`}
            >
              {task.priority}
            </Badge>
          )}
        </div>
      </div>
      {isExpanded && hasSubtasks && (
        <div className="mt-1">
          {cachedSubtasks.map((subtask) => (
            <TaskListItem
              key={subtask.id}
              task={subtask}
              level={level + 1}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(TaskListItem);


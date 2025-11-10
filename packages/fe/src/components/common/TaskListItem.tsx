import { TaskDTO } from "@self-flow/common/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
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
  hiddenInfos?: ("check" | "status" | "effort" | "priority")[];
  level?: number;
  onEditTask: (task: TaskDTO) => void;
  onStatusChange?: (
    taskId: string,
    status: TaskDTO["status"],
    completed: boolean
  ) => void;
};

const TaskListItem = ({
  task,
  level = 0,
  hiddenInfos = [],
  onEditTask,
  onStatusChange,
}: TaskListItemProps) => {
  const [checked, setChecked] = useState(
    task.completed || ["completed", "not done"].includes(task.status || "")
  );
  const [currentStatus, setCurrentStatus] = useState<TaskDTO["status"] | null>(
    task.status ?? null
  );

  useEffect(() => {
    setChecked(
      task.completed || ["completed", "not done"].includes(task.status || "")
    );
    setCurrentStatus(task.status ?? null);
  }, [task.completed, task.status]);

  const { subtasks: subtasksCache, fetchTaskSubtasks } = useSubtasks();

  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = useCallback(() => {
    if (!task.id) {
      console.error("Cannot expand task without ID");
      return;
    }
    setIsExpanded(!isExpanded);
    fetchTaskSubtasks(task.id);
  }, [setIsExpanded, isExpanded, fetchTaskSubtasks, task]);

  const hasSubtasks = task.subtaskCount && task.subtaskCount > 0;
  const cachedSubtasks = subtasksCache?.[task.id] || [];

  const toggleTaskComplete = async (task: TaskDTO, completed: boolean) => {
    if (!task.id) {
      console.error("Cannot toggle task without ID");
      return;
    }

    const previousStatus = currentStatus ?? "todo";
    const previousCompleted = checked;
    const nextStatus: TaskDTO["status"] = completed ? "completed" : "todo";

    setChecked(completed);
    setCurrentStatus(nextStatus);
    onStatusChange?.(task.id, nextStatus, completed);

    try {
      await api.tasks.update(task.id, {
        completed,
        status: nextStatus,
      });
    } catch (error) {
      console.error("Error toggling task completion:", error);
      setChecked(previousCompleted);
      setCurrentStatus(previousStatus);
      onStatusChange?.(task.id, previousStatus, previousCompleted);
    }
  };

  return (
    <div key={task.id} className={`${level > 0 ? "ml-4 sm:ml-6" : ""}`}>
      <div className="flex items-start sm:items-center gap-2 p-2 border rounded hover:bg-gray-50">
        <div className="flex items-center gap-1 flex-shrink-0">
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
        </div>
        {!hiddenInfos.includes("check") && (
          <Checkbox
            checked={checked}
            onCheckedChange={(checked) => toggleTaskComplete(task, !!checked)}
            className="flex-shrink-0 mt-0.5 sm:mt-0"
          />
        )}
        <span
          className={`flex-1 min-w-0 text-xs sm:text-sm cursor-pointer hover:text-blue-600 break-words ${
            checked ? "line-through text-gray-500" : ""
          } ${currentStatus === "not done" ? "line-through text-red-500" : ""}`}
          onClick={() => onEditTask?.(task)}
        >
          {task.title}
        </span>
        <div className="flex flex-wrap gap-1 flex-shrink-0">
          {task.isTemplate && (
            <Badge className="text-[10px] sm:text-xs">Template</Badge>
          )}
          {!hiddenInfos.includes("status") && currentStatus && (
            <Badge
              className={`text-[10px] sm:text-xs ${getStatusBadgeColor(
                currentStatus
              )}`}
            >
              {currentStatus}
            </Badge>
          )}
          {!hiddenInfos.includes("effort") && task.effort && (
            <Badge
              className={`text-[10px] sm:text-xs ${getEffortBadgeColor(task.effort)}`}
            >
              {task.effort}
            </Badge>
          )}
          {!hiddenInfos.includes("priority") && task.priority && (
            <Badge
              className={`text-[10px] sm:text-xs ${getPriorityBadgeColor(task.priority)}`}
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
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(TaskListItem);

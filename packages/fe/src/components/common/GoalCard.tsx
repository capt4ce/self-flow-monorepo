"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Edit,
  Trash2,
  Plus,
  Calendar,
  ChevronRight,
  ChevronDown,
  Expand,
  FolderPlus,
  Folder,
} from "lucide-react";
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
import { format } from "date-fns";
import { GoalDTO, GoalCategory, GoalStatus } from "@self-flow/common/types";
import { TaskDTO } from "@self-flow/common/types";
import {
  getCategoryBadgeColor,
  getStatusBadgeColor,
  getEffortBadgeColor,
} from "@/utils/badgeColors";
import { useAuth } from "@/contexts/AuthContext";
import TaskGroupDialog from "@/components/dialogs/TaskGroupDialog";
import { TaskGroupDTO } from "@self-flow/common/types";
import TaskListItem from "./TaskListItem";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import moveElement from "@/helpers/moveElement";
import { api } from "@/lib/api-client";

interface GoalCardProps {
  goal: GoalDTO;
  onEdit?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
  onAddTask?: (goalId: string, parentId?: string) => void;
  onEditTask?: (task: TaskDTO) => void;
  onToggleGoalStatus?: (goalId: string, currentStatus: string) => void;
  onCreateTaskGroup?: (goalId: string) => void;
  onEditTaskGroup?: (groupId: string) => void;
  onDeleteTaskGroup?: (groupId: string) => void;
  onMoveTaskToGroup?: (taskId: string, groupId: string | null) => void;
  updateGoalTasks?: (goalId: string, tasks: TaskDTO[]) => void;
  showTasks?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onAddTask,
  onEditTask,
  onToggleGoalStatus,
  onCreateTaskGroup,
  onEditTaskGroup,
  onDeleteTaskGroup,
  onMoveTaskToGroup,
  updateGoalTasks,
  showTasks = true,
  showProgress = true,
  compact = false,
}) => {
  const [groupDialogOpen, setGroupDialogOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<TaskGroupDTO | null>(
    null
  );
  const tasks = goal.tasks || [];

  const taskCount = goal.taskCount || tasks.length;
  const completedTaskCount =
    goal.completedTaskCount || tasks.filter((t) => t.completed).length;

  const handleDragEnd = async (result: any) => {
    const {
      reason,
      source: { index: sourceIdx },
      destination,
    } = result;
    
    if (
      reason !== "DROP" ||
      !destination ||
      destination.droppableId !== goal.id ||
      sourceIdx === destination.index
    ) {
      return;
    }

    const newTasksOrder = moveElement(tasks, sourceIdx, destination.index);
    
    // Update order indexes
    const orders = newTasksOrder.map((task, idx) => ({
      taskId: task.id,
      orderIndex: idx,
    }));

    // Optimistically update local state
    updateGoalTasks?.(goal.id, newTasksOrder.map((task, idx) => ({ ...task, orderIndex: idx })));

    try {
      await api.tasks.reorder(orders);
    } catch (error) {
      console.error("Error reordering tasks:", error);
      // Revert on error
      updateGoalTasks?.(goal.id, tasks);
    }
  };

  return (
    <Card className="bg-white hover:shadow-md transition-shadow">
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle
              className={`${
                compact ? "text-base" : "text-lg"
              } mb-2 cursor-pointer hover:text-blue-600`}
              onClick={() => onEdit?.(goal.id)}
            >
              {goal.title}
            </CardTitle>
            <div className="flex gap-2 mb-2">
              <Badge
                className={getCategoryBadgeColor(goal.category as GoalCategory)}
              >
                {goal.category}
              </Badge>
              {goal.status && (
                <Badge
                  variant={goal.status === "active" ? "default" : "secondary"}
                >
                  {goal.status}
                </Badge>
              )}
            </div>
          </div>
          {!compact && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  onClick={() => onEdit(goal.id)}
                  title="Edit goal"
                >
                  <Edit size={16} />
                </Button>
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 text-red-500 hover:text-red-700"
                      title="Delete goal"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{goal.title}
                        "? This action cannot be undone and will remove all
                        associated tasks.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(goal.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
        {goal.description && (
          <div
            className={`text-sm text-muted-foreground whitespace-pre-wrap ${
              compact ? "line-clamp-1" : "line-clamp-2"
            }`}
            dangerouslySetInnerHTML={{
              __html: (goal.description || "").replace(/\n/g, "<br />"),
            }}
          />
        )}
        {(goal.startDate || goal.endDate) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {goal.startDate && format(new Date(goal.startDate), "MMM dd")}
            {goal.startDate && goal.endDate && " - "}
            {goal.endDate && format(new Date(goal.endDate), "MMM dd")}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {showProgress && taskCount > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>
              Tasks: {completedTaskCount}/{taskCount}
            </span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    taskCount > 0 ? (completedTaskCount / taskCount) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {showTasks && (
          <div className="space-y-4 mb-4">
            {/* Ungrouped Tasks */}
            {(() => {
              const ungroupedTasks = tasks.filter((task) => !task.groupId);

              return ungroupedTasks.length > 0 ? (
                <div className="space-y-2">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId={goal.id}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {ungroupedTasks.map((task, idx) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={idx}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-1 ${
                                    snapshot.isDragging ? "opacity-50" : ""
                                  }`}
                                >
                                  <TaskListItem
                                    task={task}
                                    onEditTask={onEditTask || (() => {})}
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
                </div>
              ) : null;
            })()}
          </div>
        )}

        {showTasks && tasks.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm mb-4">
            No tasks yet.
          </div>
        )}

        <div className="flex gap-2">
          {onToggleGoalStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onToggleGoalStatus(goal.id, goal.status || "active")
              }
              className="flex-1"
            >
              Mark as {goal.status === "active" ? "Done" : "Active"}
            </Button>
          )}
          {onCreateTaskGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCreateTaskGroup(goal.id)}
              title="Create task group"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Group
            </Button>
          )}
          {onAddTask && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddTask(goal.id)}
              className={
                onToggleGoalStatus || onCreateTaskGroup ? "" : "w-full"
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
          {compact && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => onEdit(goal.id)}
              title="Edit goal"
            >
              <Edit size={16} />
            </Button>
          )}
          {compact && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-red-500 hover:text-red-700"
                  title="Delete goal"
                >
                  <Trash2 size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{goal.title}"? This action
                    cannot be undone and will remove all associated tasks.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(goal.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Task Group Dialog */}
        <TaskGroupDialog
          open={groupDialogOpen}
          onOpenChange={setGroupDialogOpen}
          group={editingGroup}
          onSave={async (title) => {
            // This would be handled by the parent component
            console.log("Save group:", title);
          }}
        />
      </CardContent>
    </Card>
  );
};

export default GoalCard;


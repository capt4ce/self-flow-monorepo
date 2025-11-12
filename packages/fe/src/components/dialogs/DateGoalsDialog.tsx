
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X, Plus, Check } from "lucide-react";
import { format } from "date-fns";
import { GoalDTO, GoalCategory } from "@self-flow/common/types";
import { TaskDTO } from "@self-flow/common/types";
import GoalFormDialog from "./GoalFormDialog";

interface DateGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  goals: GoalDTO[];
  isLoading?: boolean;
  onGoalSaved?: () => Promise<void> | void;
}

// Goal category colors matching the timeline
const GOAL_CATEGORY_COLORS: Record<GoalCategory, string> = {
  Main: "bg-yellow-400",
  Yearly: "bg-orange-400",
  Quarterly: "bg-red-400",
  Monthly: "bg-green-400",
  Weekly: "bg-blue-400",
  Daily: "bg-purple-400",
};

// Order of goal categories for display
const GOAL_CATEGORY_ORDER: GoalCategory[] = [
  "Main",
  "Yearly",
  "Quarterly",
  "Monthly",
  "Weekly",
];

const DateGoalsDialog: React.FC<DateGoalsDialogProps> = ({
  open,
  onOpenChange,
  date,
  goals,
  isLoading = false,
  onGoalSaved,
}) => {
  const [goalFormDialogOpen, setGoalFormDialogOpen] = useState(false);

  // Check if a goal is active on a specific date
  const isGoalActiveOnDate = (goal: GoalDTO, date: Date): boolean => {
    if (goal.category === "Main") {
      return goal.status !== "done";
    }

    if (goal.status !== "active") return false;

    const dateStr = date.toISOString().split("T")[0];

    // If no dates specified, goal is always active
    if (!goal.startDate && !goal.endDate) return true;

    // Check if date is within range
    if (goal.startDate && goal.endDate) {
      return dateStr >= goal.startDate && dateStr <= goal.endDate;
    }
    if (goal.startDate) {
      return dateStr >= goal.startDate;
    }
    if (goal.endDate) {
      return dateStr <= goal.endDate;
    }

    return false;
  };

  // Get active goals for the date, grouped by category
  const getGoalsByCategory = () => {
    if (!date) return {};

    const activeGoals = goals.filter((goal) =>
      isGoalActiveOnDate(goal, date)
    );

    const grouped: Partial<Record<GoalCategory, GoalDTO[]>> = {};

    activeGoals.forEach((goal) => {
      const category = goal.category as GoalCategory;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category]!.push(goal);
    });

    return grouped;
  };

  const goalsByCategory = getGoalsByCategory();
  const totalActiveGoals = Object.values(goalsByCategory).reduce(
    (sum, goals) => sum + goals.length,
    0
  );

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return "";
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Format: "Jan 1 - Dec 31" (match image format)
      return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
    }
    if (startDate) {
      return `From ${format(new Date(startDate), "MMM d")}`;
    }
    if (endDate) {
      return `Until ${format(new Date(endDate), "MMM d")}`;
    }
    return "";
  };

  const formatFullDate = (date: Date) => {
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const handleGoalSaved = async () => {
    try {
      await onGoalSaved?.();
    } catch (error) {
      console.error("Error refreshing goals after save:", error);
    }
  };

  if (!date) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader className="relative">
            <DialogTitle className="text-xl sm:text-2xl font-bold pr-8">
              Goals for {formatFullDate(date)}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {totalActiveGoals} active {totalActiveGoals === 1 ? "goal" : "goals"}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create New Goal Button */}
            <Button
              onClick={() => setGoalFormDialogOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Goal
            </Button>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading goals...
              </div>
            ) : totalActiveGoals === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active goals for this date.
              </div>
            ) : (
              // Display goals by category
              GOAL_CATEGORY_ORDER.map((category) => {
                const categoryGoals = goalsByCategory[category] || [];
                if (categoryGoals.length === 0) return null;

                return (
                  <div key={category} className="space-y-3">
                    {/* Category Header */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${GOAL_CATEGORY_COLORS[category]}`}
                      />
                      <h3 className="font-semibold text-base">
                        {category} ({categoryGoals.length})
                      </h3>
                    </div>

                    {/* Goal Cards */}
                    {categoryGoals.map((goal) => {
                      const tasks = goal.tasks || [];
                      const taskCount = goal.taskCount || tasks.length;
                      const completedTaskCount =
                        goal.completedTaskCount ||
                        tasks.filter((t) => t.completed).length;
                      const progress =
                        taskCount > 0 ? (completedTaskCount / taskCount) * 100 : 0;

                      return (
                        <Card key={goal.id} className="bg-white">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-base flex-1">
                                {goal.title}
                              </h4>
                              <div className="flex flex-col items-end">
                                {(goal.startDate || goal.endDate) && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDateRange(goal.startDate, goal.endDate)}
                                  </span>
                                )}
                                {taskCount > 0 && (
                                  <span className="text-xs text-muted-foreground mt-1">
                                    {completedTaskCount}/{taskCount} tasks
                                  </span>
                                )}
                              </div>
                            </div>
                            {taskCount > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  Progress
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{
                                      width: `${progress}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent>
                            {tasks.length > 0 ? (
                              <div className="space-y-2">
                                {tasks.map((task: TaskDTO) => {
                                  const isCompleted =
                                    task.completed || task.status === "completed";
                                  const isNotDone = task.status === "not done";

                                  return (
                                    <div
                                      key={task.id}
                                      className="flex items-center gap-2"
                                    >
                                      <div
                                        className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                          isCompleted
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-300"
                                        }`}
                                      >
                                        {isCompleted && (
                                          <Check className="w-3 h-3 text-green-600" />
                                        )}
                                      </div>
                                      <span
                                        className={`text-sm flex-1 ${
                                          isCompleted || isNotDone
                                            ? "line-through text-muted-foreground"
                                            : "text-foreground"
                                        }`}
                                      >
                                        {task.title}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No tasks yet.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Form Dialog */}
      <GoalFormDialog
        open={goalFormDialogOpen}
        onOpenChange={setGoalFormDialogOpen}
        goal={null}
        onSaved={handleGoalSaved}
      />
    </>
  );
};

export default DateGoalsDialog;


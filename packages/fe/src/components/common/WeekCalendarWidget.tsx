
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { GoalDTO, GoalCategory } from "@self-flow/common/types";
import { useAuth } from "@/contexts/AuthContext";
import DateGoalsDialog from "@/components/dialogs/DateGoalsDialog";

interface WeekCalendarWidgetProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onOpenMonthCalendar: () => void;
}

// Goal category colors in order (top to bottom)
const GOAL_CATEGORY_COLORS: Record<GoalCategory, string> = {
  Main: "bg-yellow-400",
  Yearly: "bg-orange-400",
  Quarterly: "bg-red-400",
  Monthly: "bg-green-400",
  Weekly: "bg-blue-400",
  Daily: "bg-purple-400", // Used for dot indicator
};

// Order of goal categories for stacking (top to bottom)
const GOAL_CATEGORY_ORDER: GoalCategory[] = [
  "Main",
  "Yearly",
  "Quarterly",
  "Monthly",
  "Weekly",
];

const WeekCalendarWidget: React.FC<WeekCalendarWidgetProps> = ({
  selectedDate,
  onDateChange,
  onOpenMonthCalendar,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [goals, setGoals] = useState<GoalDTO[]>([]);
  const { user } = useAuth();
  const [dateGoalsDialogOpen, setDateGoalsDialogOpen] = useState(false);
  const [selectedDateForDialog, setSelectedDateForDialog] = useState<Date | null>(null);

  // Fetch goals when user is available
  useEffect(() => {
    if (!user) return;

    const fetchGoals = async () => {
      try {
        const response = await api.goals.list("active");
        setGoals(response.data || []);
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    };

    fetchGoals();
  }, [user]);

  // Check if a goal is active on a specific date
  const isGoalActiveOnDate = (goal: GoalDTO, date: Date): boolean => {
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

  // Get active goals for a specific date, grouped by category
  const getActiveGoalsForDate = (date: Date) => {
    const activeGoals = goals.filter((goal) => isGoalActiveOnDate(goal, date));
    const goalsByCategory: Record<GoalCategory, boolean> = {
      Main: false,
      Yearly: false,
      Quarterly: false,
      Monthly: false,
      Weekly: false,
      Daily: false,
    };

    activeGoals.forEach((goal) => {
      if (goal.category in goalsByCategory) {
        goalsByCategory[goal.category as GoalCategory] = true;
      }
    });

    return goalsByCategory;
  };

  const weekDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the start of the week (3 days before today)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 3 + weekOffset * 7);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [weekOffset]);

  const handlePreviousWeek = () => {
    setWeekOffset(weekOffset - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(weekOffset + 1);
  };

  const handleTodayClick = () => {
    setWeekOffset(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onDateChange(today);
  };

  const formatDay = (date: Date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return "";
      }
      return date.getDate().toString();
    } catch (e) {
      console.error("Error formatting day:", e);
      return "";
    }
  };

  const formatDayName = (date: Date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } catch (e) {
      console.error("Error formatting day name:", e);
      return "";
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate || !(selectedDate instanceof Date)) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Update week offset when selectedDate changes externally (e.g., from month calendar or date click)
  // This ensures the week view shows the selected date when it's changed from outside this component
  React.useEffect(() => {
    if (!selectedDate || !(selectedDate instanceof Date)) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Normalize selectedDate to ensure it's a proper Date object
    const normalizedSelectedDate = new Date(selectedDate);
    normalizedSelectedDate.setHours(0, 0, 0, 0);

    // Check if selectedDate is visible in current week view using a ref-like pattern
    setWeekOffset((currentOffset) => {
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - 3 + currentOffset * 7);
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

      // Only update offset if selectedDate is not in the current week view
      if (
        normalizedSelectedDate < currentWeekStart ||
        normalizedSelectedDate > currentWeekEnd
      ) {
        const daysDiff = Math.floor(
          (normalizedSelectedDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const expectedOffset = Math.round((daysDiff + 3) / 7);
        return expectedOffset;
      }
      return currentOffset;
    });
  }, [selectedDate]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-4 border-b bg-card">
      <div className="flex flex-1 items-center gap-1 sm:gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousWeek}
          className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto">
          {weekDates.map((date) => {
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const selected = isSelected(date);
            const today = isToday(date);
            const activeGoals = getActiveGoalsForDate(date);
            const hasDailyGoal = activeGoals.Daily;

            return (
              <button
                key={dateKey}
                onClick={() => onDateChange(date)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-12 h-20 sm:w-14 sm:h-24 rounded-lg transition-all duration-200 flex-shrink-0",
                  "hover:bg-accent/50",
                  // Selected date styling (highest priority)
                  selected &&
                    "bg-background border-2 border-foreground shadow-md",
                  // Today's date styling (when not selected)
                  !selected && today && "bg-accent/50",
                  // Default styling
                  !selected && !today && "hover:border hover:border-border"
                )}
              >
                {/* Stacked timeline bars */}
                <div
                  className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col gap-0.5 cursor-pointer z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDateForDialog(date);
                    setDateGoalsDialogOpen(true);
                  }}
                  title="Click to view goals for this date"
                >
                  {GOAL_CATEGORY_ORDER.map((category) => {
                    const hasGoal = activeGoals[category];
                    return (
                      <div
                        key={category}
                        className={cn(
                          "w-6 sm:w-7 h-1 rounded-sm",
                          hasGoal
                            ? GOAL_CATEGORY_COLORS[category]
                            : "bg-gray-300 opacity-40"
                        )}
                      />
                    );
                  })}
                </div>

                {/* Day name */}
                <span
                  className={cn(
                    "text-xs sm:text-sm font-medium mt-4 sm:mt-5",
                    selected
                      ? "text-foreground font-semibold"
                      : today && !selected
                        ? "text-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {formatDayName(date)}
                </span>

                {/* Date number */}
                <span
                  className={cn(
                    "text-base sm:text-lg font-semibold",
                    selected && "text-foreground",
                    !selected && today && "text-foreground"
                  )}
                >
                  {formatDay(date)}
                </span>

                {/* Daily goal dot indicator */}
                {hasDailyGoal && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500" />
                )}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
        >
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenMonthCalendar}
          className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-initial"
        >
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Month</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleTodayClick}
          className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-initial"
        >
          Today
        </Button>
      </div>

      {/* Date Goals Dialog */}
      <DateGoalsDialog
        open={dateGoalsDialogOpen}
        onOpenChange={setDateGoalsDialogOpen}
        date={selectedDateForDialog}
      />
    </div>
  );
};

export default WeekCalendarWidget;

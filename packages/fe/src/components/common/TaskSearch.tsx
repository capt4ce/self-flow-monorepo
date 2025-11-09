
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { Progress } from "../ui/progress";
import { api } from "@/lib/api-client";
import { TaskDTO } from "@self-flow/common/types";

type TaskSearchProps = {
  label: string;
  selectedExistingTaskIds: string[];
  setSelectedExistingTaskIds: (ids: string[] | ((prev: string[]) => string[])) => void;
};

const TaskSearch = ({
  label,
  selectedExistingTaskIds,
  setSelectedExistingTaskIds,
}: TaskSearchProps) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchQueryToApply] = useDebounce(searchQuery, 1000);

  const [availableTasks, setAvailableTasks] = React.useState<TaskDTO[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const searchTasks = async (searchQuery: string) => {
    try {
      const response = await api.tasks.search(searchQuery, {
        excludeStatus: ["completed", "not done"],
        excludeCompleted: true,
      });
      setAvailableTasks(response.data);
    } catch (error) {
      console.error("Error fetching available tasks:", error);
      setAvailableTasks([]);
    }
  };

  React.useEffect(() => {
    setIsSearching(true);
    searchTasks(searchQueryToApply).then(() => setIsSearching(false));
  }, [searchQueryToApply]);

  return (
    <>
      {/* Add Existing Tasks as Subtasks Section */}
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {isSearching ? (
              <Progress />
            ) : (
              availableTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                >
                  <Checkbox
                    checked={selectedExistingTaskIds.includes(task.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedExistingTaskIds([
                          ...selectedExistingTaskIds,
                          task.id,
                        ]);
                      } else {
                        setSelectedExistingTaskIds(
                          selectedExistingTaskIds.filter((id) => id !== task.id)
                        );
                      }
                    }}
                  />
                  <span className="text-sm">{task.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default React.memo(TaskSearch);


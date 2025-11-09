
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { Progress } from "../ui/progress";
import { TaskDTO } from "@self-flow/common/types";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { api } from "@/lib/api-client";

type TaskAutocompleteProps = {
  label: string;
  onTasksSelected: (tasks: TaskDTO[]) => void;
};

const TaskAutocomplete = ({
  label,
  onTasksSelected,
}: TaskAutocompleteProps) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchQueryToApply] = useDebounce(searchQuery, 300);

  const [availableTasks, setAvailableTasks] = React.useState<TaskDTO[]>([]);
  const [selectedTasks, setSelectedTasks] = React.useState<TaskDTO[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const searchTasks = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setAvailableTasks([]);
      return;
    }

    try {
      const response = await api.tasks.search(searchQuery, {
        isTemplate: true,
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

  const handleToggleTaskSelection = (task: TaskDTO) => {
    setSelectedTasks((prev) =>
      prev.find((t) => t.id === task.id)
        ? prev.filter((t) => t.id !== task.id)
        : [...prev, task]
    );
  };

  const handleAddSelectedTasks = () => {
    onTasksSelected(selectedTasks);
    setSelectedTasks([]);
    setAvailableTasks([]);
    setSearchQuery("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for a task to duplicate..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="max-h-40 overflow-y-auto space-y-1 border-t">
        {isSearching && <Progress className="w-full" />}
        {!isSearching && availableTasks.length > 0 && (
          <div className="border rounded-md">
            {availableTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100"
              >
                <Checkbox
                  checked={selectedTasks.some((t) => t.id === task.id)}
                  onCheckedChange={() => handleToggleTaskSelection(task)}
                />
                <span className="text-sm font-medium">{task.title}</span>
              </div>
            ))}
          </div>
        )}
        {!isSearching && availableTasks.length === 0 && searchQuery && (
          <p className="text-sm text-muted-foreground p-2">No tasks found.</p>
        )}
      </div>
      {selectedTasks.length > 0 && (
        <Button onClick={handleAddSelectedTasks} className="w-full">
          Add {selectedTasks.length} selected task(s)
        </Button>
      )}
    </div>
  );
};

export default TaskAutocomplete;


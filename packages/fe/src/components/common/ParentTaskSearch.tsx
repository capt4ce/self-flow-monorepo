"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useDebounce } from "use-debounce";
import { Progress } from "../ui/progress";
import { TaskDTO } from "@self-flow/common/types";
import { api } from "@/lib/api-client";

type ParentTaskSearchProps = {
  label: string;
  selectedParentId: string | null | undefined;
  setSelectedParentId: (id: string | null) => void;
  currentTaskId?: string;
};

const ParentTaskSearch = ({
  label,
  selectedParentId,
  setSelectedParentId,
  currentTaskId,
}: ParentTaskSearchProps) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchQueryToApply] = useDebounce(searchQuery, 1000);

  const [availableTasks, setAvailableTasks] = React.useState<TaskDTO[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedParent, setSelectedParent] = React.useState<TaskDTO | null>(null);

  const searchTasks = async (searchQuery: string) => {
    try {
      const response = await api.tasks.search(searchQuery, {
        excludeStatus: ["completed", "not done"],
        excludeCompleted: true,
      });
      let filtered = response.data;
      
      // Exclude current task if editing
      if (currentTaskId) {
        filtered = filtered.filter((t) => t.id !== currentTaskId);
      }
      
      setAvailableTasks(filtered);
    } catch (error) {
      console.error("Error fetching available tasks:", error);
      setAvailableTasks([]);
    }
  };

  React.useEffect(() => {
    setIsSearching(true);
    searchTasks(searchQueryToApply).then(() => setIsSearching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQueryToApply]);

  React.useEffect(() => {
    if (selectedParentId) {
      const fetchParent = async () => {
        try {
          // Get all tasks and find the parent
          const response = await api.tasks.list(100, 0);
          const parent = response.data.find((t: TaskDTO) => t.id === selectedParentId);
          if (parent) {
            setSelectedParent(parent);
          }
        } catch (error) {
          console.error("Error fetching parent task:", error);
        }
      };
      fetchParent();
    } else {
      setSelectedParent(null);
    }
  }, [selectedParentId]);

  return (
    <>
      <div className="space-y-2">
        <Label>{label}</Label>
        {selectedParent && (
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-sm">{selectedParent.title}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedParentId(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
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
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                >
                  <span className="text-sm">{task.title}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedParentId(task.id)}
                  >
                    Select
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default React.memo(ParentTaskSearch);


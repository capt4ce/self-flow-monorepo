
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
import { TaskGroupDTO } from "@self-flow/common/types";

interface TaskGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: TaskGroupDTO | null;
  onSave: (title: string) => Promise<void>;
}

const TaskGroupDialog: React.FC<TaskGroupDialogProps> = ({
  open,
  onOpenChange,
  group,
  onSave,
}) => {
  const [title, setTitle] = useState(group?.title || "");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (group) {
      setTitle(group.title);
    } else {
      setTitle("");
    }
  }, [group]);

  const handleSave = async () => {
    if (title.trim() === "") return;

    setLoading(true);
    try {
      await onSave(title.trim());
      setTitle("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task group:", error);
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
      <DialogContent onKeyDown={handleKeyDown} className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {group ? "Edit Task Group" : "Create Task Group"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-title">Group Title</Label>
            <Input
              id="group-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter group title"
            />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={loading}>
            {loading ? "Saving..." : group ? "Update Group" : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskGroupDialog;


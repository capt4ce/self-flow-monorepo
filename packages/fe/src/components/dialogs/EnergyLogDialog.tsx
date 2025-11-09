
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";

interface EnergyReading {
  id?: string;
  level: number;
  note?: string;
  timestamp: Date | string;
}

interface EnergyLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  energyReading?: EnergyReading | null;
  onSaved?: () => void;
}

const defaultLevel = 5;

const EnergyLogDialog: React.FC<EnergyLogDialogProps> = ({
  open,
  onOpenChange,
  energyReading,
  onSaved,
}) => {
  const { user } = useAuth();
  const [editLevel, setEditLevel] = useState(
    energyReading?.level || defaultLevel
  );
  const [editTime, setEditTime] = useState(
    energyReading?.timestamp
      ? format(new Date(energyReading.timestamp), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [editNote, setEditNote] = useState(energyReading?.note || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (energyReading?.id) {
        setEditLevel(energyReading.level);
        setEditTime(format(new Date(energyReading.timestamp), "yyyy-MM-dd'T'HH:mm"));
        setEditNote(energyReading.note || "");
      } else {
        resetForm();
      }
    }
  }, [open, energyReading]);

  const resetForm = () => {
    setEditLevel(defaultLevel);
    setEditTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setEditNote("");
  };

  const handleSaveEdit = async () => {
    if (!energyReading?.id || !user) return;

    setSaving(true);
    try {
      await api.energy.update(energyReading.id, {
        level: editLevel,
        note: editNote.trim() || undefined,
        timestamp: new Date(editTime).toISOString(),
      });

      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating energy reading:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddReading = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await api.energy.create({
        level: editLevel,
        note: editNote.trim() || undefined,
        timestamp: new Date(editTime).toISOString(),
      });

      resetForm();
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding energy reading:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (energyReading?.id) {
      handleSaveEdit();
    } else {
      handleAddReading();
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
        className="w-[95vw] sm:w-full max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {energyReading?.id ? "Edit Energy Reading" : "Add Energy Reading"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="add-energy-level" className="text-sm sm:text-base">
                Energy Level: {editLevel}
              </Label>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {editLevel}/10
              </span>
            </div>
            <Slider
              id="add-energy-level"
              min={1}
              max={10}
              step={1}
              value={[editLevel]}
              onValueChange={(value) => setEditLevel(value[0])}
              className="py-4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-time" className="text-sm sm:text-base">Time</Label>
            <Input
              id="add-time"
              type="datetime-local"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-note" className="text-sm sm:text-base">Note (optional)</Label>
            <Input
              id="add-note"
              placeholder="What were you doing?"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {energyReading?.id ? "Edit Reading" : "Add Reading"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnergyLogDialog;



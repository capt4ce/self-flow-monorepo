
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

interface MonthCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
}

const MonthCalendarDialog: React.FC<MonthCalendarDialogProps> = ({
  open,
  onOpenChange,
  selectedDate,
  onDateSelect,
}) => {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Date</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            // className="rounded-md border"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonthCalendarDialog;

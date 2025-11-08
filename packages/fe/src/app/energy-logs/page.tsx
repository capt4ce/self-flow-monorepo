"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";

interface EnergyReading {
  id?: string;
  level: number;
  note?: string;
  timestamp: Date | string;
}

export default function AllEnergyLogsPage() {
  const { user } = useAuth();
  const [energyReadings, setEnergyReadings] = useState<EnergyReading[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<EnergyReading | null>(
    null
  );
  const [editLevel, setEditLevel] = useState(5);
  const [editNote, setEditNote] = useState("");
  const [editTime, setEditTime] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEnergyReadings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchEnergyReadings = async () => {
    try {
      const response = await api.energy.list();
      const readings = (response.data || []).map((reading: any) => ({
        ...reading,
        timestamp: new Date(reading.timestamp),
      }));
      setEnergyReadings(readings.sort((a: EnergyReading, b: EnergyReading) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
    } catch (error) {
      console.error("Error fetching energy readings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReading = (reading: EnergyReading) => {
    setEditingReading(reading);
    setEditLevel(reading.level);
    setEditNote(reading.note || "");
    setEditTime(format(new Date(reading.timestamp), "yyyy-MM-dd'T'HH:mm"));
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReading || !user) return;

    try {
      await api.energy.update(editingReading.id!, {
        level: editLevel,
        note: editNote.trim() || null,
        timestamp: new Date(editTime).toISOString(),
      });

      const updatedReading: EnergyReading = {
        ...editingReading,
        level: editLevel,
        note: editNote.trim() || undefined,
        timestamp: new Date(editTime),
      };

      const updatedReadings = energyReadings
        .map((reading) =>
          reading.id === editingReading.id ? updatedReading : reading
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setEnergyReadings(updatedReadings);
      setEditDialogOpen(false);
      setEditingReading(null);
    } catch (error) {
      console.error("Error updating energy reading:", error);
    }
  };

  const handleDeleteReading = async (id: string) => {
    if (!user) return;

    try {
      await api.energy.delete(id);
      const updatedReadings = energyReadings.filter(
        (reading) => reading.id !== id
      );
      setEnergyReadings(updatedReadings);
    } catch (error) {
      console.error("Error deleting energy reading:", error);
    }
  };

  const handleAddReading = async () => {
    if (!user) return;

    try {
      const response = await api.energy.create({
        level: editLevel,
        note: editNote.trim() || null,
        timestamp: new Date(editTime).toISOString(),
      });

      const newReading: EnergyReading = {
        ...response.data,
        timestamp: new Date(response.data.timestamp),
      };

      const updatedReadings = [...energyReadings, newReading].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setEnergyReadings(updatedReadings);
      setAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding energy reading:", error);
    }
  };

  const resetForm = () => {
    setEditLevel(5);
    setEditNote("");
    setEditTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  };

  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Energy Logs</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View and manage all your energy readings
            </p>
          </div>
          <Button 
            onClick={openAddDialog}
            className="w-full sm:w-auto"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Reading
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Energy Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Loading energy readings...
                </div>
              ) : energyReadings.length > 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart visualization coming soon
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No energy readings yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Readings List */}
          <Card>
            <CardHeader>
              <CardTitle>All Readings ({energyReadings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {energyReadings.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {energyReadings
                    .sort(
                      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                    .map((reading) => (
                      <div
                        key={reading.id}
                        className="flex items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 border rounded-lg hover:bg-accent/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm sm:text-base">
                              Level: {reading.level}/10
                            </span>
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: `hsl(${(reading.level / 10) * 120}, 70%, 50%)`,
                              }}
                            />
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {format(
                              new Date(reading.timestamp),
                              "MMM dd, yyyy 'at' HH:mm"
                            )}
                          </p>
                          {reading.note && (
                            <p className="text-xs sm:text-sm text-foreground/70 mt-1 break-words">
                              {reading.note}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditReading(reading)}
                            title="Edit reading"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteReading(reading.id!)}
                            title="Delete reading"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No energy readings yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Energy Reading</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-energy-level">
                    Energy Level: {editLevel}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {editLevel}/10
                  </span>
                </div>
                <Slider
                  id="edit-energy-level"
                  min={1}
                  max={10}
                  step={1}
                  value={[editLevel]}
                  onValueChange={(value) => setEditLevel(value[0])}
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="datetime-local"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-note">Note (optional)</Label>
                <Input
                  id="edit-note"
                  placeholder="What were you doing?"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                />
              </div>

              <Button onClick={handleSaveEdit} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Energy Reading</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="add-energy-level">
                    Energy Level: {editLevel}
                  </Label>
                  <span className="text-sm text-muted-foreground">
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
                <Label htmlFor="add-time">Time</Label>
                <Input
                  id="add-time"
                  type="datetime-local"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-note">Note (optional)</Label>
                <Input
                  id="add-note"
                  placeholder="What were you doing?"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                />
              </div>

              <Button onClick={handleAddReading} className="w-full">
                Add Reading
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


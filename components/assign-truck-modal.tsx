"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Truck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

interface Technician {
  id: string;
  name: string;
  email: string;
  status: string;
  assignedTrucks: string[];
}

interface AssignTruckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  truck: any;
  technicians: Technician[];
  onAssignSuccess?: (updatedTruck: any) => void; // Callback to update parent state
}

export function AssignTruckDialog({
  isOpen,
  onClose,
  truck,
  technicians,
  onAssignSuccess,
}: AssignTruckDialogProps) {
  const { token } = useAuth();
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const availableTechnicians = technicians.filter(
    (tech) => tech.status === "active"
  );

  const handleAssign = async () => {
    if (!selectedTechnician) {
      setError("Please select a technician");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/trucks/${truck.id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedTechnician }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to assign truck");
      }

      // Call the success callback with the minimal updated data
      onAssignSuccess?.({
        id: truck.id,
        assigned_technician: result.data.assigned_technician,
      });

      onClose();
    } catch (error: any) {
      setError(error.message || "Error assigning truck. Please try again.");
      console.error("Assign truck error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/trucks/${truck.id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: null }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to unassign truck");
      }

      // Call the success callback with the minimal updated data
      onAssignSuccess?.({
        id: truck.id,
        assigned_technician: result.data.assigned_technician,
      });

      onClose();
    } catch (error: any) {
      setError(error.message || "Error unassigning truck. Please try again.");
      console.error("Unassign truck error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {truck.assignedTechnician ? "Reassign" : "Assign"} Truck
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-red-600">{error}</CardContent>
            </Card>
          )}

          {/* Current Truck Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#10294B] rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{truck.name}</h4>
                  <p className="text-sm text-gray-600">
                    {truck.model} ({truck.year})
                  </p>
                  <p className="text-sm text-gray-500">{truck.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Assignment */}
          {truck.assignedTechnician && (
            <div className="space-y-3">
              <Label>Currently Assigned To:</Label>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {truck.assignedTechnician
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">
                          {truck.assignedTechnician}
                        </p>
                        <p className="text-sm text-blue-700">
                          ID: {truck.technicianId}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnassign}
                      disabled={isLoading}
                      className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                    >
                      Unassign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* New Assignment */}
          <div className="space-y-3">
            <Label htmlFor="technician">
              {truck.assignedTechnician
                ? "Reassign to:"
                : "Assign to Technician:"}
            </Label>
            <Select
              value={selectedTechnician}
              onValueChange={setSelectedTechnician}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a technician" />
              </SelectTrigger>
              <SelectContent>
                {availableTechnicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <span className="font-medium">{tech.name}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline" className="text-xs">
                          {tech.assignedTrucks.length} trucks
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Technician Info */}
          {selectedTechnician && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                {(() => {
                  const tech = availableTechnicians.find(
                    (t) => t.id === selectedTechnician
                  );
                  return tech ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {tech.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-green-900">
                          {tech.name}
                        </p>
                        <p className="text-sm text-green-700">{tech.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-green-600">
                            Currently has {tech.assignedTrucks.length} truck(s)
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedTechnician || isLoading}
              className="bg-[#E3253D] hover:bg-[#E3253D]/90"
            >
              {isLoading
                ? "Processing..."
                : truck.assignedTechnician
                ? "Reassign"
                : "Assign"}{" "}
              Truck
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

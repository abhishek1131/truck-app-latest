"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

interface EditBinModalProps {
  truckId: string;
  bin: any;
  onBinUpdated: () => void;
}

export function EditBinModal({
  truckId,
  bin,
  onBinUpdated,
}: EditBinModalProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(bin.name || "");
  const [binCode, setBinCode] = useState(bin.code || "");
  const [description, setDescription] = useState(bin.description || "");
  const [maxCapacity, setMaxCapacity] = useState(bin.maxCapacity || 10);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    try {
      setErrorMessage("");
      const response = await fetch(
        `/api/technician/trucks/${truckId}/bins/${bin.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            bin_code: binCode,
            description,
            max_capacity: maxCapacity,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        onBinUpdated();
        setOpen(false);
      } else {
        setErrorMessage(data.error || "Failed to update bin");
        console.error("Failed to update bin:", data.error);
      }
    } catch (error) {
      setErrorMessage("Something went wrong while updating bin");
      console.error("Error updating bin:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-16 flex flex-col space-y-2 w-full bg-transparent"
        >
          <Edit className="h-5 w-5" />
          <span className="text-xs">Edit Bin</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Bin</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {errorMessage && (
            <div className="relative p-3 rounded-md bg-red-100 text-red-800 border border-red-300">
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage("")}
                className="absolute right-2 top-2 text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="binCode">Bin Code</Label>
            <Input
              id="binCode"
              value={binCode}
              onChange={(e) => setBinCode(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxCapacity">Max Capacity (Items)</Label>
            <Input
              id="maxCapacity"
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              min="0"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#E3253D] hover:bg-[#E3253D]/90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

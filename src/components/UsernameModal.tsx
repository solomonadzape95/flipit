"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  userId: string;
  onUsernameUpdate: (newUsername: string) => void;
}

export default function UsernameModal({
  isOpen,
  onClose,
  currentUsername,
  userId,
  onUsernameUpdate,
}: UsernameModalProps) {
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!newUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (newUsername.length > 20) {
      toast.error("Username must be 20 characters or less");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/users/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username: newUsername.trim() }),
      });

      if (response.ok) {
        onUsernameUpdate(newUsername.trim());
        toast.success("Username updated!");
        onClose();
      } else {
        toast.error("Failed to update username");
      }
    } catch (error) {
      toast.error("Failed to update username");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Update Username</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose a display name for the leaderboard
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter your username"
              maxLength={20}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {newUsername.length}/20 characters
            </p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating || !newUsername.trim() || newUsername === currentUsername}
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

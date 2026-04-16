"use client";

import { createGroup } from "@/lib/actions/groups";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

export default function NewGroupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");

  function addPlayer() {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    setPlayerNames((prev) => [...prev, trimmed]);
    setNewPlayerName("");
  }

  function removePlayer(index: number) {
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.delete("playerNames");
    playerNames.forEach((name) => formData.append("playerNames", name));
    const result = await createGroup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create a Group</h1>
      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Friday Night Poker"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Players (optional)</Label>
              <p className="text-sm text-muted-foreground">
                Add players who don&apos;t have accounts yet. They can claim their profile later.
              </p>
              <div className="flex gap-2">
                <Input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPlayer();
                    }
                  }}
                  placeholder="Player name"
                />
                <Button type="button" variant="outline" onClick={addPlayer}>
                  Add
                </Button>
              </div>
              {playerNames.length > 0 && (
                <div className="space-y-1">
                  {playerNames.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => removePlayer(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

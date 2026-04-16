"use client";

import { useState } from "react";
import { createSession } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CreateSessionFormProps {
  groupId: string;
  players: { id: string; displayName: string; isPlaceholder: boolean }[];
  lastSessionPlayerIds: string[];
}

export function CreateSessionForm({
  groupId,
  players,
  lastSessionPlayerIds,
}: CreateSessionFormProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set(players.map((p) => p.id))
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function togglePlayer(id: string) {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedPlayers(new Set(players.map((p) => p.id)));
  }

  function sameAsLast() {
    setSelectedPlayers(new Set(lastSessionPlayerIds));
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("groupId", groupId);
    // Remove any existing playerIds and add selected ones
    formData.delete("playerIds");
    selectedPlayers.forEach((id) => formData.append("playerIds", id));

    const result = await createSession(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="e.g. $0.25/$0.50 NLH"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Players</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                {lastSessionPlayerIds.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={sameAsLast}
                  >
                    Same as Last
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {players.map((player) => (
                <label
                  key={player.id}
                  className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayers.has(player.id)}
                    onChange={() => togglePlayer(player.id)}
                    className="h-4 w-4"
                  />
                  <span>{player.displayName}</span>
                  {player.isPlaceholder && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Unclaimed
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || selectedPlayers.size === 0}
          >
            {loading ? "Creating..." : "Start Game"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

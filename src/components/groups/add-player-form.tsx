"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlaceholderPlayer } from "@/lib/actions/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AddPlayerFormProps {
  groupId: string;
}

export function AddPlayerForm({ groupId }: AddPlayerFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    const result = await createPlaceholderPlayer(groupId, trimmed);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Added ${trimmed}`);
      setName("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder="Player name"
      />
      <Button onClick={handleAdd} disabled={loading || !name.trim()}>
        {loading ? "Adding..." : "Add"}
      </Button>
    </div>
  );
}

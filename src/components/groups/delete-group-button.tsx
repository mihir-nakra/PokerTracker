"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteGroup } from "@/lib/actions/groups";
import { toast } from "sonner";

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this group? All sessions, entries, and member data will be permanently removed. This cannot be undone.")) return;
    setLoading(true);
    const result = await deleteGroup(groupId);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" disabled={loading} onClick={handleDelete}>
      {loading ? "Deleting..." : "Delete Group"}
    </Button>
  );
}

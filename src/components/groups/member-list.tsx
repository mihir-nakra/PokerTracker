"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { removeMember, updateMemberRole } from "@/lib/actions/groups";
import { deletePlaceholderPlayer } from "@/lib/actions/players";
import { toast } from "sonner";

interface Member {
  userId: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  isPlaceholder: boolean;
}

interface MemberListProps {
  members: Member[];
  groupId: string;
  currentUserId: string;
  currentUserRole: string;
}

export function MemberList({
  members,
  groupId,
  currentUserId,
  currentUserRole,
}: MemberListProps) {
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  async function handleRoleChange(userId: string, newRole: string) {
    const result = await updateMemberRole(groupId, userId, newRole);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Role updated");
    }
  }

  async function handleRemove(userId: string) {
    const result = await removeMember(groupId, userId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Member removed");
    }
  }

  async function handleDeletePlaceholder(userId: string) {
    if (!confirm("Delete this placeholder player? This will remove all their session data.")) return;
    const result = await deletePlaceholderPlayer(userId, groupId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Player removed");
    }
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const initials = member.displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        const isSelf = member.userId === currentUserId;
        const isOwner = member.role === "owner";

        return (
          <div
            key={member.userId}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatarUrl ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{member.displayName}</span>
              {member.isPlaceholder && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Unclaimed
                </Badge>
              )}
              {isSelf && (
                <Badge variant="outline" className="text-xs">
                  You
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canManage && !isOwner && !isSelf ? (
                <>
                  {member.isPlaceholder ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeletePlaceholder(member.userId)}
                    >
                      Delete
                    </Button>
                  ) : (
                    <>
                      <Select
                        defaultValue={member.role}
                        onValueChange={(v) => v && handleRoleChange(member.userId, String(v))}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">admin</SelectItem>
                          <SelectItem value="member">member</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleRemove(member.userId)}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Badge variant="secondary">{member.role}</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

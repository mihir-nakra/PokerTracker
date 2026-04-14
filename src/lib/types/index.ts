import type { Database } from "./database";

export type { Database };

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionPlayer = Database["public"]["Tables"]["session_players"]["Row"];
export type Entry = Database["public"]["Tables"]["entries"]["Row"];
export type LeaderboardRow = Database["public"]["Views"]["leaderboard"]["Row"];

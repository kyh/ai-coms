import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials, type AvatarColor, type User } from "@/lib/workspace";

/**
 * Static class strings, one per palette token — Tailwind can only see classes
 * it can read literally, so these must never be interpolated.
 */
const AVATAR_CLASSES: Record<AvatarColor, string> = {
  rose: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  amber: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  emerald: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  sky: "bg-sky-500/20 text-sky-700 dark:text-sky-300",
  violet: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  fuchsia: "bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300",
  cyan: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
  lime: "bg-lime-600/20 text-lime-700 dark:text-lime-300",
};

interface UserAvatarProps {
  user: User;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function UserAvatar({ user, size = "default", className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={cn("rounded-md after:rounded-md", className)}>
      <AvatarFallback
        aria-label={user.name}
        className={cn(
          "rounded-md font-medium tracking-tight",
          AVATAR_CLASSES[user.avatarColor],
          size === "sm" && "text-[10px]",
        )}
      >
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

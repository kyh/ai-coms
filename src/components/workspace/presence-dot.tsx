import { cn } from "@/lib/utils";
import type { Presence } from "@/lib/workspace";

/** Slack's convention: filled = online, hollow = away, hollow+dim = offline. */
const PRESENCE_STYLES: Record<Presence, { className: string; label: string }> = {
  online: { className: "border-emerald-500 bg-emerald-500", label: "Online" },
  away: { className: "border-amber-500 bg-transparent", label: "Away" },
  offline: { className: "border-muted-foreground/50 bg-transparent", label: "Offline" },
};

export function PresenceDot({ presence, className }: { presence: Presence; className?: string }) {
  const style = PRESENCE_STYLES[presence];
  return (
    <span
      aria-label={style.label}
      title={style.label}
      className={cn("size-2 shrink-0 rounded-full border-[1.5px]", style.className, className)}
    />
  );
}

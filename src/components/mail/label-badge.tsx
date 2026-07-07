import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/thread";

/** Deterministic dot color per label so labels are scannable across panes. */
const LABEL_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-fuchsia-500",
];

export const labelColor = (label: string): string => {
  let hash = 0;
  for (const char of label) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % LABEL_COLORS.length ** 2;
  }
  return LABEL_COLORS[hash % LABEL_COLORS.length] ?? "bg-blue-500";
};

export const LabelBadge = ({ label }: { label: string }) => (
  <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
    <span className={cn("size-1.5 rounded-full", labelColor(label))} />
    {label}
  </Badge>
);

const PRIORITY_STYLES: Record<Exclude<Priority, "none">, { label: string; className: string }> = {
  high: {
    label: "High",
    className:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400",
  },
  med: {
    label: "Med",
    className:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400",
  },
  low: {
    label: "Low",
    className:
      "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-400",
  },
};

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  if (priority === "none") return null;
  const style = PRIORITY_STYLES[priority];
  return (
    <Badge variant="outline" className={cn("font-medium", style.className)}>
      {style.label}
    </Badge>
  );
};

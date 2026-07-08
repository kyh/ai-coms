"use client";

import { ArchiveIcon, InboxIcon, RotateCcwIcon, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { allLabels, threadsForFolder, useThreadStore, type Folder } from "@/lib/thread-store";
import { cn } from "@/lib/utils";
import { labelColor } from "./label-badge";

const FOLDERS: { id: Folder; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { id: "inbox", label: "Inbox", icon: InboxIcon },
    { id: "starred", label: "Starred", icon: StarIcon },
    { id: "archived", label: "Archived", icon: ArchiveIcon },
  ];

export function MailSidebar() {
  const threads = useThreadStore((state) => state.threads);
  const folder = useThreadStore((state) => state.folder);
  const activeLabel = useThreadStore((state) => state.activeLabel);
  const setFolder = useThreadStore((state) => state.setFolder);
  const setActiveLabel = useThreadStore((state) => state.setActiveLabel);
  const resetMailbox = useThreadStore((state) => state.resetMailbox);

  const unreadCount = threads.filter((thread) => !thread.archived && thread.unread).length;
  const labels = allLabels(threads);

  const folderCount = (id: Folder): number =>
    id === "inbox" ? unreadCount : threadsForFolder(threads, id).length;

  return (
    <nav className="flex h-full w-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-0.5 p-2">
          {FOLDERS.map(({ id, label, icon: Icon }) => {
            const count = folderCount(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFolder(id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  folder === id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
                {count > 0 && (
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {labels.length > 0 && (
            <>
              <div className="px-2 pt-4 pb-1 text-xs font-medium text-muted-foreground">Labels</div>
              {labels.map(({ label, count }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveLabel(activeLabel === label ? null : label)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    activeLabel === label
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <span className={cn("size-2 rounded-full", labelColor(label))} />
                  {label}
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
      <div className="shrink-0 border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={resetMailbox}
        >
          <RotateCcwIcon />
          Reset demo data
        </Button>
      </div>
    </nav>
  );
}

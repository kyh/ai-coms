"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { InboxIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { threadLastActivity, threadSender, threadSnippet, type Thread } from "@/lib/thread";
import { sortByActivity, threadsForFolder, useThreadStore } from "@/lib/thread-store";
import { cn } from "@/lib/utils";
import { LabelBadge, PriorityBadge } from "./label-badge";

const FOLDER_TITLES = {
  inbox: "Inbox",
  starred: "Starred",
  archived: "Archived",
};

const matchesSearch = (thread: Thread, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    thread.subject,
    ...thread.participants,
    ...thread.labels,
    ...thread.messages.map((message) => `${message.from} ${message.body}`),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
};

export function ThreadList() {
  const threads = useThreadStore((state) => state.threads);
  const folder = useThreadStore((state) => state.folder);
  const activeLabel = useThreadStore((state) => state.activeLabel);
  const search = useThreadStore((state) => state.search);
  const selectedThreadId = useThreadStore((state) => state.selectedThreadId);
  const selectThread = useThreadStore((state) => state.selectThread);

  const visible = sortByActivity(
    threadsForFolder(threads, folder).filter(
      (thread) =>
        (!activeLabel || thread.labels.includes(activeLabel)) && matchesSearch(thread, search),
    ),
  );

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <h1 className="text-sm font-medium">
          {FOLDER_TITLES[folder]}
          {activeLabel ? ` · ${activeLabel}` : ""}
        </h1>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{visible.length}</span>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        {visible.length === 0 ? (
          <Empty className="border-0 p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>Nothing here</EmptyTitle>
              <EmptyDescription>
                {search.trim() ? "No threads match your search." : "This folder is empty."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col">
            {visible.map((thread) => {
              const selected = thread.id === selectedThreadId;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => selectThread(thread.id)}
                  className={cn(
                    "flex flex-col gap-1 border-b px-3 py-2.5 text-left transition-colors",
                    selected ? "bg-muted" : "hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        thread.unread ? "bg-blue-500" : "bg-transparent",
                      )}
                    />
                    <span
                      className={cn(
                        "truncate text-sm",
                        thread.unread ? "font-semibold" : "font-medium text-muted-foreground",
                      )}
                    >
                      {threadSender(thread)}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNowStrict(new Date(threadLastActivity(thread)), {
                        addSuffix: false,
                      })}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "truncate pl-3.5 text-sm",
                      thread.unread ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {thread.subject}
                  </div>
                  <div className="truncate pl-3.5 text-xs text-muted-foreground">
                    {threadSnippet(thread, 90)}
                  </div>
                  {(thread.priority !== "none" || thread.labels.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1 pl-3.5 pt-0.5">
                      <PriorityBadge priority={thread.priority} />
                      {thread.labels.map((label) => (
                        <LabelBadge key={label} label={label} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

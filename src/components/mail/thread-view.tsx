"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  FlagIcon,
  MailIcon,
  MailOpenIcon,
  SendIcon,
  StarIcon,
  TagIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ME, prioritySchema, type Thread } from "@/lib/thread";
import { allLabels, useThreadStore } from "@/lib/thread-store";
import { cn } from "@/lib/utils";
import { LabelBadge, PriorityBadge } from "./label-badge";

const PRIORITY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "med", label: "Medium" },
  { value: "high", label: "High" },
];

function ThreadActions({ thread }: { thread: Thread }) {
  const threads = useThreadStore((state) => state.threads);
  const setStarred = useThreadStore((state) => state.setStarred);
  const setArchived = useThreadStore((state) => state.setArchived);
  const setUnread = useThreadStore((state) => state.setUnread);
  const setPriority = useThreadStore((state) => state.setPriority);
  const addLabel = useThreadStore((state) => state.addLabel);
  const removeLabel = useThreadStore((state) => state.removeLabel);
  const selectThread = useThreadStore((state) => state.selectThread);

  const [newLabel, setNewLabel] = React.useState("");
  const labels = allLabels(threads);

  const submitNewLabel = () => {
    if (!newLabel.trim()) return;
    addLabel(thread.id, newLabel);
    setNewLabel("");
  };

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={thread.starred ? "Unstar" : "Star"}
              onClick={() => setStarred([thread.id], !thread.starred)}
            />
          }
        >
          <StarIcon className={cn(thread.starred && "fill-amber-400 text-amber-400")} />
        </TooltipTrigger>
        <TooltipContent>{thread.starred ? "Unstar" : "Star"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={thread.archived ? "Move to inbox" : "Archive"}
              onClick={() => setArchived([thread.id], !thread.archived)}
            />
          }
        >
          {thread.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
        </TooltipTrigger>
        <TooltipContent>{thread.archived ? "Move to inbox" : "Archive"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={thread.unread ? "Mark as read" : "Mark as unread"}
              onClick={() => {
                setUnread([thread.id], !thread.unread);
                if (!thread.unread) selectThread(null);
              }}
            />
          }
        >
          {thread.unread ? <MailOpenIcon /> : <MailIcon />}
        </TooltipTrigger>
        <TooltipContent>{thread.unread ? "Mark as read" : "Mark as unread"}</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Priority" />}
        >
          <FlagIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={thread.priority}
            onValueChange={(value) => {
              const parsed = prioritySchema.safeParse(value);
              if (parsed.success) setPriority(thread.id, parsed.data);
            }}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Labels" />}>
          <TagIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Labels</DropdownMenuLabel>
          {labels.map(({ label }) => (
            <DropdownMenuCheckboxItem
              key={label}
              checked={thread.labels.includes(label)}
              onCheckedChange={(checked) => {
                if (checked) {
                  addLabel(thread.id, label);
                } else {
                  removeLabel(thread.id, label);
                }
              }}
            >
              {label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <div className="p-1">
            <Input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitNewLabel();
                }
              }}
              placeholder="New label…"
              className="h-7 text-xs"
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ThreadView() {
  const threads = useThreadStore((state) => state.threads);
  const selectedThreadId = useThreadStore((state) => state.selectedThreadId);
  const drafts = useThreadStore((state) => state.drafts);
  const setDraft = useThreadStore((state) => state.setDraft);
  const sendReply = useThreadStore((state) => state.sendReply);

  const thread = threads.find((candidate) => candidate.id === selectedThreadId);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const messageCount = thread?.messages.length ?? 0;
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [selectedThreadId, messageCount]);

  if (!thread) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MailOpenIcon />
            </EmptyMedia>
            <EmptyTitle>No thread selected</EmptyTitle>
            <EmptyDescription>
              Pick a thread from the list, or ask the assistant what needs your attention.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const draft = drafts[thread.id] ?? "";

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <h1 className="min-w-0 truncate text-sm font-semibold">{thread.subject}</h1>
        <PriorityBadge priority={thread.priority} />
        <div className="ml-auto shrink-0">
          <ThreadActions thread={thread} />
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{thread.participants.join(", ")}</span>
            {thread.labels.map((label) => (
              <LabelBadge key={label} label={label} />
            ))}
          </div>
          {thread.messages.map((message) => {
            const mine = message.from === ME;
            return (
              <article
                key={message.id}
                className={cn(
                  "rounded-lg border p-3",
                  mine ? "border-primary/20 bg-primary/5" : "bg-card",
                )}
              >
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-sm font-medium">{message.from}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {format(new Date(message.at), "MMM d, p")}
                  </span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</div>
              </article>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        className="shrink-0 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          sendReply(thread.id);
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-lg border bg-background p-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(thread.id, event.target.value)}
            placeholder={`Reply to ${thread.participants.filter((p) => p !== ME).join(", ") || "thread"}…`}
            rows={3}
            className="min-h-0 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="flex items-center justify-between">
            <span className="pl-1 text-xs text-muted-foreground">
              AI drafts land here — review before sending
            </span>
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              Send
              <SendIcon />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import * as React from "react";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { MessageSquareIcon, SmilePlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ME,
  messageGroups,
  REACTION_EMOJI,
  threadReplies,
  type Message,
  type User,
} from "@/lib/workspace";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { UserAvatar } from "./user-avatar";

const dayLabel = (iso: string): string => {
  const date = new Date(iso);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
};

function DayDivider({ at }: { at: string }) {
  return (
    <div className="relative py-3">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      <div className="relative mx-auto w-fit rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        {dayLabel(at)}
      </div>
    </div>
  );
}

function ReactionPills({ message, users }: { message: Message; users: User[] }) {
  const toggleReaction = useWorkspaceStore((state) => state.toggleReaction);
  if (message.reactions.length === 0) return null;

  const nameOf = (userId: string): string =>
    userId === ME ? "You" : (users.find((user) => user.id === userId)?.name ?? "Someone");

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {message.reactions.map((reaction) => {
        const mine = reaction.by.includes(ME);
        return (
          <button
            key={reaction.emoji}
            type="button"
            title={`${reaction.by.map(nameOf).join(", ")} reacted with ${reaction.emoji}`}
            onClick={() => toggleReaction(message.id, reaction.emoji)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
              mine
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <span aria-hidden>{reaction.emoji}</span>
            <span className="tabular-nums">{reaction.by.length}</span>
          </button>
        );
      })}
    </div>
  );
}

function ReactionPicker({ messageId }: { messageId: string }) {
  const toggleReaction = useWorkspaceStore((state) => state.toggleReaction);
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Add reaction"
            className="size-6 bg-background"
          />
        }
      >
        <SmilePlusIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-fit gap-0 p-1">
        <div className="flex gap-0.5">
          {REACTION_EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`React with ${emoji}`}
              onClick={() => {
                toggleReaction(messageId, emoji);
                setOpen(false);
              }}
              className="rounded-md p-1 text-base leading-none transition-colors hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ThreadAffordance({ message }: { message: Message }) {
  const messages = useWorkspaceStore((state) => state.messages);
  const openThread = useWorkspaceStore((state) => state.openThread);
  const replies = threadReplies(messages, message.id);
  if (replies.length === 0) return null;

  const last = replies.at(-1);
  return (
    <button
      type="button"
      onClick={() => openThread(message.id)}
      className="mt-1 flex items-center gap-1.5 rounded-md py-0.5 text-xs font-medium text-primary transition-colors hover:underline"
    >
      <MessageSquareIcon className="size-3" />
      {replies.length} {replies.length === 1 ? "reply" : "replies"}
      {last && (
        <span className="font-normal text-muted-foreground">
          Last reply {format(new Date(last.at), "p")}
        </span>
      )}
    </button>
  );
}

interface MessageListProps {
  messages: Message[];
  users: User[];
  /** Thread panes hide the "N replies" affordance — replies have no replies. */
  showThreads?: boolean;
  /** Thread panes are short enough that day dividers are noise. */
  showDayDividers?: boolean;
}

/**
 * The Slack look: consecutive messages from one author collapse into a group
 * that renders the avatar and byline once. Every row keeps its own hover
 * toolbar, reactions, and thread affordance.
 */
export function MessageList({
  messages,
  users,
  showThreads = true,
  showDayDividers = true,
}: MessageListProps) {
  const groups = messageGroups(messages);

  return (
    <div className="flex flex-col py-2">
      {groups.map((group, groupIndex) => {
        const author = users.find((user) => user.id === group.authorId);
        const previous = groups[groupIndex - 1];
        const newDay =
          showDayDividers &&
          (previous === undefined || !isSameDay(new Date(previous.at), new Date(group.at)));

        return (
          <React.Fragment key={group.id}>
            {newDay && <DayDivider at={group.at} />}
            <div className="flex gap-2.5 px-4 pt-2">
              <div className="w-8 shrink-0">{author && <UserAvatar user={author} />}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold">{author?.name ?? "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(group.at), "p")}
                  </span>
                </div>
                {group.messages.map((message) => (
                  <div
                    key={message.id}
                    className="group/message relative -mx-2 rounded-md px-2 hover:bg-muted/40"
                  >
                    <div className="absolute -top-3 right-2 hidden group-hover/message:block">
                      <ReactionPicker messageId={message.id} />
                    </div>
                    <p className="text-sm leading-6 whitespace-pre-wrap">{message.body}</p>
                    <ReactionPills message={message} users={users} />
                    {showThreads && <ThreadAffordance message={message} />}
                  </div>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

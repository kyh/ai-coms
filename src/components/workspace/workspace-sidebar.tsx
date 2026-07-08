"use client";

import * as React from "react";
import { HashIcon, PlusIcon, RotateCcwIcon, VolumeOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { conversationTitle, ME, unreadCount, type Conversation, type User } from "@/lib/workspace";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { CreateChannelDialog } from "./create-channel-dialog";
import { PresenceDot } from "./presence-dot";
import { UserAvatar } from "./user-avatar";

function ConversationButton({
  conversation,
  users,
  unread,
  active,
  onSelect,
}: {
  conversation: Conversation;
  users: User[];
  unread: number;
  active: boolean;
  onSelect: () => void;
}) {
  const partner =
    conversation.kind === "dm" ? users.find((user) => user.id === conversation.userId) : undefined;
  const bold = unread > 0 && !active;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        active
          ? "bg-muted font-medium text-foreground"
          : bold
            ? "font-semibold text-foreground hover:bg-muted/50"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {conversation.kind === "channel" ? (
        <HashIcon className="size-3.5 shrink-0 opacity-70" />
      ) : (
        <PresenceDot presence={partner?.presence ?? "offline"} className="mx-[3px]" />
      )}
      <span className="min-w-0 truncate">{conversationTitle(conversation, users)}</span>
      {conversation.kind === "channel" && conversation.muted && (
        <VolumeOffIcon className="size-3 shrink-0 text-muted-foreground" aria-label="Muted" />
      )}
      {unread > 0 && (
        <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold tabular-nums text-primary-foreground">
          {unread}
        </span>
      )}
    </button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pt-4 pb-1 text-xs font-medium text-muted-foreground">{children}</div>;
}

export function WorkspaceSidebar() {
  const users = useWorkspaceStore((state) => state.users);
  const conversations = useWorkspaceStore((state) => state.conversations);
  const messages = useWorkspaceStore((state) => state.messages);
  const status = useWorkspaceStore((state) => state.status);
  const selectedConversationId = useWorkspaceStore((state) => state.selectedConversationId);
  const selectConversation = useWorkspaceStore((state) => state.selectConversation);
  const resetWorkspace = useWorkspaceStore((state) => state.resetWorkspace);

  const [createOpen, setCreateOpen] = React.useState(false);

  const me = users.find((user) => user.id === ME);
  const channels = conversations.filter((conversation) => conversation.kind === "channel");
  const dms = conversations.filter((conversation) => conversation.kind === "dm");

  return (
    <nav className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center gap-2 px-3 py-2.5">
        {me && <UserAvatar user={me} size="sm" />}
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">Ballentine</span>
          <span className="truncate text-xs text-muted-foreground">
            {status.text.length > 0 ? `${status.emoji} ${status.text}` : "Active"}
          </span>
        </div>
      </div>
      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-0.5 p-2">
          <SectionHeading>Channels</SectionHeading>
          {channels.map((conversation) => (
            <ConversationButton
              key={conversation.id}
              conversation={conversation}
              users={users}
              unread={unreadCount(conversation, messages)}
              active={conversation.id === selectedConversationId}
              onSelect={() => selectConversation(conversation.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <PlusIcon className="size-3.5 shrink-0 opacity-70" />
            New channel
          </button>

          <SectionHeading>Direct messages</SectionHeading>
          {dms.map((conversation) => (
            <ConversationButton
              key={conversation.id}
              conversation={conversation}
              users={users}
              unread={unreadCount(conversation, messages)}
              active={conversation.id === selectedConversationId}
              onSelect={() => selectConversation(conversation.id)}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={resetWorkspace}
        >
          <RotateCcwIcon />
          Reset demo data
        </Button>
      </div>

      <CreateChannelDialog open={createOpen} onOpenChange={setCreateOpen} />
    </nav>
  );
}

"use client";

import * as React from "react";
import { HashIcon, MessagesSquareIcon, SparklesIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { rootMessages } from "@/lib/workspace";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";
import { PresenceDot } from "./presence-dot";

interface ConversationViewProps {
  /** Sends a canned prompt to the assistant panel. */
  onAskAssistant: (prompt: string) => void;
}

export function ConversationView({ onAskAssistant }: ConversationViewProps) {
  const users = useWorkspaceStore((state) => state.users);
  const conversations = useWorkspaceStore((state) => state.conversations);
  const messages = useWorkspaceStore((state) => state.messages);
  const drafts = useWorkspaceStore((state) => state.drafts);
  const selectedConversationId = useWorkspaceStore((state) => state.selectedConversationId);
  const setDraft = useWorkspaceStore((state) => state.setDraft);
  const sendMessage = useWorkspaceStore((state) => state.sendMessage);

  const conversation = conversations.find((candidate) => candidate.id === selectedConversationId);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const visible = conversation ? rootMessages(messages, conversation.id) : [];
  const messageCount = visible.length;
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [selectedConversationId, messageCount]);

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessagesSquareIcon />
            </EmptyMedia>
            <EmptyTitle>No conversation selected</EmptyTitle>
            <EmptyDescription>
              Pick a channel or DM from the sidebar, or ask the assistant what you missed.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const partner =
    conversation.kind === "dm" ? users.find((user) => user.id === conversation.userId) : undefined;
  const title = conversation.kind === "channel" ? conversation.name : (partner?.name ?? "Unknown");
  /** Label tracks the prompt: a channel gets caught up on, a DM gets summarized. */
  const summarizeLabel = conversation.kind === "channel" ? "Catch me up" : "Summarize";
  const summarizePrompt =
    conversation.kind === "channel"
      ? `Catch me up on #${conversation.name}`
      : `Summarize my conversation with ${title}`;
  const draft = drafts[conversation.id] ?? "";

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="flex shrink-0 items-center gap-1 text-sm font-semibold">
            {conversation.kind === "channel" ? (
              <HashIcon className="size-3.5 opacity-70" />
            ) : (
              <PresenceDot presence={partner?.presence ?? "offline"} className="mr-0.5" />
            )}
            {title}
          </h1>
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {conversation.kind === "channel" ? conversation.purpose : (partner?.title ?? "")}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {conversation.kind === "channel" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
              <UsersIcon className="size-3.5" />
              {conversation.memberIds.length}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => onAskAssistant(summarizePrompt)}>
            <SparklesIcon />
            {summarizeLabel}
          </Button>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <MessageList messages={visible} users={users} />
        <div ref={bottomRef} />
      </ScrollArea>

      <MessageComposer
        value={draft}
        onChange={(value) => setDraft(conversation.id, value)}
        onSend={() => sendMessage(conversation.id, draft)}
        placeholder={
          conversation.kind === "channel" ? `Message #${conversation.name}` : `Message ${title}`
        }
        hint="AI drafts land here — review before sending"
      />
    </div>
  );
}

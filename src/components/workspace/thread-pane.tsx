"use client";

import * as React from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { conversationTitle, threadReplies } from "@/lib/workspace";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";

/**
 * The thread pane overlays the assistant panel rather than adding a fifth
 * column: at most one of the two is useful at a time, and overlaying keeps the
 * assistant mounted so its transcript survives opening a thread.
 */
export function ThreadPane() {
  const users = useWorkspaceStore((state) => state.users);
  const conversations = useWorkspaceStore((state) => state.conversations);
  const messages = useWorkspaceStore((state) => state.messages);
  const openThreadId = useWorkspaceStore((state) => state.openThreadId);
  const closeThread = useWorkspaceStore((state) => state.closeThread);
  const sendThreadReply = useWorkspaceStore((state) => state.sendThreadReply);

  const [reply, setReply] = React.useState("");
  const parent = messages.find((message) => message.id === openThreadId);

  // A thread whose parent vanished (reset, corrupt storage) closes itself.
  React.useEffect(() => {
    if (openThreadId !== null && parent === undefined) closeThread();
  }, [openThreadId, parent, closeThread]);

  React.useEffect(() => {
    setReply("");
  }, [openThreadId]);

  if (!parent) return null;

  const conversation = conversations.find((candidate) => candidate.id === parent.conversationId);
  const replies = threadReplies(messages, parent.id);

  return (
    <aside className="flex h-full w-full flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <h2 className="text-sm font-medium">Thread</h2>
        {conversation && (
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {conversation.kind === "channel" ? "#" : ""}
            {conversationTitle(conversation, users)}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close thread"
          className="ml-auto"
          onClick={closeThread}
        >
          <XIcon />
        </Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <MessageList
          messages={[parent]}
          users={users}
          showThreads={false}
          showDayDividers={false}
        />
        {replies.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-1">
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </span>
            <Separator className="flex-1" />
          </div>
        )}
        <MessageList messages={replies} users={users} showThreads={false} showDayDividers={false} />
      </ScrollArea>

      <MessageComposer
        value={reply}
        onChange={setReply}
        onSend={() => {
          sendThreadReply(parent.id, reply);
          setReply("");
        }}
        placeholder="Reply in thread…"
        rows={2}
      />
    </aside>
  );
}

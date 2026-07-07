"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import {
  ArchiveIcon,
  InboxIcon,
  KeyIcon,
  MailCheckIcon,
  PenLineIcon,
  RotateCcwIcon,
  SendIcon,
  SparklesIcon,
  StarIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveThreadsDataSchema,
  draftReplyDataSchema,
  markThreadsDataSchema,
  starThreadsDataSchema,
  triageThreadsDataSchema,
} from "@/ai/messages/data-parts";
import type { ComsChatUIMessage } from "@/ai/messages/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { buildMailboxContext } from "@/lib/mailbox-context";
import { useComsStore } from "@/lib/thread-store";
import { cn } from "@/lib/utils";
import { ApiKeyDialog, GATEWAY_API_KEY_STORAGE_KEY } from "./api-key-dialog";
import { demoTransport } from "./demo-transport";

const EXAMPLE_PROMPTS = [
  "Triage my inbox",
  "Summarize the thread with Acme",
  "Draft a polite decline to the recruiter",
  "What needs my attention today?",
];

const pluralize = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

type ToolPartDisplay = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

const describeToolPart = (part: ComsChatUIMessage["parts"][number]): ToolPartDisplay | null => {
  switch (part.type) {
    case "tool-triageThreads": {
      const n = part.input?.updates?.length;
      return {
        icon: InboxIcon,
        label:
          part.state === "output-available"
            ? `Triaged ${pluralize(n ?? 0, "thread")}`
            : "Triaging threads…",
      };
    }
    case "tool-draftReply":
      return {
        icon: PenLineIcon,
        label: part.state === "output-available" ? "Draft placed in composer" : "Drafting a reply…",
      };
    case "tool-archiveThreads": {
      const archiving = part.input?.value !== false;
      return {
        icon: ArchiveIcon,
        label:
          part.state === "output-available"
            ? `${archiving ? "Archived" : "Unarchived"} ${pluralize(part.input?.threadIds?.length ?? 0, "thread")}`
            : `${archiving ? "Archiving" : "Unarchiving"} threads…`,
      };
    }
    case "tool-starThreads": {
      const starring = part.input?.value !== false;
      return {
        icon: StarIcon,
        label:
          part.state === "output-available"
            ? `${starring ? "Starred" : "Unstarred"} ${pluralize(part.input?.threadIds?.length ?? 0, "thread")}`
            : `${starring ? "Starring" : "Unstarring"} threads…`,
      };
    }
    case "tool-markThreads": {
      const unread = part.input?.unread === true;
      return {
        icon: MailCheckIcon,
        label:
          part.state === "output-available"
            ? `Marked ${pluralize(part.input?.threadIds?.length ?? 0, "thread")} as ${unread ? "unread" : "read"}`
            : "Updating read state…",
      };
    }
    default:
      return null;
  }
};

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const threads = useComsStore((state) => state.threads);
  const selectedThreadId = useComsStore((state) => state.selectedThreadId);
  const applyTriage = useComsStore((state) => state.applyTriage);
  const setDraft = useComsStore((state) => state.setDraft);
  const selectThread = useComsStore((state) => state.selectThread);
  const setArchived = useComsStore((state) => state.setArchived);
  const setStarred = useComsStore((state) => state.setStarred);
  const setUnread = useComsStore((state) => state.setUnread);

  const [input, setInput] = React.useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = React.useState(false);
  const [apiKey, , removeApiKey] = useLocalStorage(GATEWAY_API_KEY_STORAGE_KEY, "");

  const { messages, sendMessage, setMessages, status } = useChat<ComsChatUIMessage>({
    id: apiKey,
    transport: apiKey === "demo" ? demoTransport : undefined,
    onError: (error) => {
      const message = error.message?.toLowerCase() ?? "";
      const isAuthError =
        message.includes("unauthorized") ||
        message.includes("authentication") ||
        message.includes("invalid api key") ||
        message.includes("401") ||
        message.includes("403");
      if (isAuthError) {
        removeApiKey();
        toast.error("Invalid API key. Please enter a valid Vercel Gateway API key.");
        setShowApiKeyDialog(true);
      } else {
        toast.error(error.message || "Something went wrong");
      }
    },
    onData: (dataPart) => {
      try {
        switch (dataPart.type) {
          case "data-triage-threads": {
            const { updates } = triageThreadsDataSchema.parse(dataPart.data);
            applyTriage(updates);
            toast.success(`Triaged ${pluralize(updates.length, "thread")}`);
            break;
          }
          case "data-draft-reply": {
            const { threadId, draft } = draftReplyDataSchema.parse(dataPart.data);
            setDraft(threadId, draft);
            selectThread(threadId);
            toast.success("Draft ready in the composer");
            break;
          }
          case "data-archive-threads": {
            const { threadIds, value } = archiveThreadsDataSchema.parse(dataPart.data);
            setArchived(threadIds, value);
            toast.success(
              `${value ? "Archived" : "Unarchived"} ${pluralize(threadIds.length, "thread")}`,
            );
            break;
          }
          case "data-star-threads": {
            const { threadIds, value } = starThreadsDataSchema.parse(dataPart.data);
            setStarred(threadIds, value);
            toast.success(
              `${value ? "Starred" : "Unstarred"} ${pluralize(threadIds.length, "thread")}`,
            );
            break;
          }
          case "data-mark-threads": {
            const { threadIds, unread } = markThreadsDataSchema.parse(dataPart.data);
            setUnread(threadIds, unread);
            toast.success(
              `Marked ${pluralize(threadIds.length, "thread")} as ${unread ? "unread" : "read"}`,
            );
            break;
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to apply assistant update");
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const bottomRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  const needsKey = !apiKey && process.env.NODE_ENV !== "development";

  const sendPrompt = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    if (needsKey) {
      setShowApiKeyDialog(true);
      return;
    }
    sendMessage(
      { text: trimmed },
      {
        body: {
          ...(apiKey ? { gatewayApiKey: apiKey } : {}),
          mailboxContext: buildMailboxContext(threads, selectedThreadId),
        },
      },
    );
    setInput("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendPrompt(input);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendPrompt(input);
    }
  };

  return (
    <aside className="flex h-full w-full flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <SparklesIcon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Assistant</h2>
        <div className="ml-auto flex items-center gap-1">
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="New conversation"
                    onClick={() => setMessages([])}
                  />
                }
              >
                <RotateCcwIcon />
              </TooltipTrigger>
              <TooltipContent>New conversation</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="API key"
                  onClick={() => setShowApiKeyDialog(true)}
                />
              }
            >
              <KeyIcon />
            </TooltipTrigger>
            <TooltipContent>API key</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon-sm" aria-label="Close assistant" onClick={onClose}>
            <XIcon />
          </Button>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-3">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-3 pt-6">
              <p className="px-1 text-sm text-muted-foreground">
                Manage your inbox by talking to it — triage, summarize, archive, or draft replies.
              </p>
              <div className="flex flex-col items-start gap-1.5">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
                    onClick={() => sendPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col gap-1.5",
                  message.role === "user" ? "items-end" : "items-start",
                )}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return part.text.trim() ? (
                      <div
                        key={`${message.id}-${index}`}
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {part.text}
                      </div>
                    ) : null;
                  }
                  const display = describeToolPart(part);
                  if (!display) return null;
                  const Icon = display.icon;
                  return (
                    <div
                      key={`${message.id}-${index}`}
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      <Icon className="size-3" />
                      {display.label}
                    </div>
                  );
                })}
              </div>
            ))
          )}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner className="size-3" />
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="shrink-0 border-t p-3">
        <div className="flex flex-col gap-2 rounded-lg border bg-background p-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (needsKey) setShowApiKeyDialog(true);
            }}
            placeholder="Ask about your inbox…"
            rows={2}
            className="min-h-0 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
            disabled={isLoading}
          />
          <div className="flex items-center justify-end">
            <Button
              type="submit"
              size="icon-sm"
              aria-label="Send"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Spinner className="size-3.5" /> : <SendIcon />}
            </Button>
          </div>
        </div>
      </form>

      <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />
    </aside>
  );
}

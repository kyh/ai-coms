"use client";

import * as React from "react";
import type { EveMessage, EveMessagePart } from "eve/react";
import { useEveAgent } from "eve/react";
import {
  ArchiveIcon,
  CheckIcon,
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
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  archiveThreadsPayloadSchema,
  draftReplyPayloadSchema,
  markThreadsPayloadSchema,
  starThreadsPayloadSchema,
  triageThreadsPayloadSchema,
} from "@/lib/assistant-schemas";
import { buildMailboxContext, type MailboxContext } from "@/lib/mailbox-context";
import { useThreadStore } from "@/lib/thread-store";
import { cn } from "@/lib/utils";
import { ApiKeyDialog, GATEWAY_API_KEY_STORAGE_KEY } from "./api-key-dialog";

const EXAMPLE_PROMPTS = [
  "Triage my inbox",
  "Summarize the thread with Acme",
  "Draft a polite decline to the recruiter",
  "What needs my attention today?",
];

const pluralize = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

const buildContext = (): MailboxContext => {
  const { threads, selectedThreadId } = useThreadStore.getState();
  return buildMailboxContext(threads, selectedThreadId);
};

/**
 * BYO-key transport: the stored gateway key rides as a bearer header on
 * every eve request (the channel verifier hands it to the dynamic model
 * resolver). Read from localStorage on every request — eve captures this
 * resolver once at store creation, so React state would go stale.
 */
const resolveAuthHeaders = (): Readonly<Record<string, string>> => {
  if (typeof window === "undefined") return {};
  const key = window.localStorage.getItem(GATEWAY_API_KEY_STORAGE_KEY);
  return key !== null && key.length > 0 ? { authorization: `Bearer ${key}` } : {};
};

// -----------------------------------------------------------------------------
// Tool results -> store mutations
//
// eve streams every tool result as an `action.result` event whose
// `data.result` is `{ kind: "tool-result", toolName, output, isError? }`,
// where `output` is the tool's full `execute` return value. Each payload is
// zod-parsed against the shared schemas before touching the store.
// -----------------------------------------------------------------------------

const toolResultEventSchema = z.object({
  type: z.literal("action.result"),
  data: z.object({
    status: z.enum(["completed", "failed", "rejected"]),
    result: z.object({
      kind: z.literal("tool-result"),
      toolName: z.string(),
      output: z.unknown(),
      isError: z.boolean().optional(),
    }),
  }),
});

/** `subagent.event` wraps a child session's stream event under `data.event`. */
const subagentEventSchema = z.object({
  type: z.literal("subagent.event"),
  data: z.object({ event: z.unknown() }),
});

const applyToolResult = (event: unknown): void => {
  // Delegation is forbidden by the instructions, but if the model strays,
  // unwrap the child's events so its tool results still reach the store.
  const wrapped = subagentEventSchema.safeParse(event);
  if (wrapped.success) {
    applyToolResult(wrapped.data.data.event);
    return;
  }
  const parsed = toolResultEventSchema.safeParse(event);
  if (!parsed.success) return;
  const { status, result } = parsed.data.data;
  if (status !== "completed" || result.isError === true) return;

  const store = useThreadStore.getState();
  switch (result.toolName) {
    case "triage_threads": {
      const payload = triageThreadsPayloadSchema.safeParse(result.output);
      if (!payload.success) return;
      store.applyTriage(payload.data.updates);
      toast.success(`Triaged ${pluralize(payload.data.updates.length, "thread")}`);
      break;
    }
    case "draft_reply": {
      const payload = draftReplyPayloadSchema.safeParse(result.output);
      if (!payload.success) return;
      const { threadId, draft } = payload.data;
      if (!store.threads.some((thread) => thread.id === threadId)) {
        toast.error("The assistant tried to draft a reply in a thread that no longer exists");
        return;
      }
      store.setDraft(threadId, draft);
      store.selectThread(threadId);
      toast.success("Draft ready in the composer");
      break;
    }
    case "archive_threads": {
      const payload = archiveThreadsPayloadSchema.safeParse(result.output);
      if (!payload.success) return;
      const { threadIds, value } = payload.data;
      store.setArchived(threadIds, value);
      toast.success(
        `${value ? "Archived" : "Unarchived"} ${pluralize(threadIds.length, "thread")}`,
      );
      break;
    }
    case "star_threads": {
      const payload = starThreadsPayloadSchema.safeParse(result.output);
      if (!payload.success) return;
      const { threadIds, value } = payload.data;
      store.setStarred(threadIds, value);
      toast.success(`${value ? "Starred" : "Unstarred"} ${pluralize(threadIds.length, "thread")}`);
      break;
    }
    case "mark_threads": {
      const payload = markThreadsPayloadSchema.safeParse(result.output);
      if (!payload.success) return;
      const { threadIds, unread } = payload.data;
      store.setUnread(threadIds, unread);
      toast.success(
        `Marked ${pluralize(threadIds.length, "thread")} as ${unread ? "unread" : "read"}`,
      );
      break;
    }
  }
};

/**
 * Auth-shaped failures: a 401 from the channel (keyless in prod), a
 * rejected gateway key at the model call, or a missing server key in dev.
 * All of them route back to the key dialog.
 */
const isAuthError = (error: Error): boolean =>
  /unauthorized|forbidden|authentication|api.?key|credential|401|403/i.test(error.message);

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [input, setInput] = React.useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = React.useState(false);
  const [apiKey, , removeApiKey] = useLocalStorage(GATEWAY_API_KEY_STORAGE_KEY, "");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const agent = useEveAgent({
    headers: resolveAuthHeaders,
    onEvent: applyToolResult,
    onError: (error) => {
      if (isAuthError(error)) {
        removeApiKey();
        toast.error("Invalid API key. Please enter a valid Vercel AI Gateway API key.");
        setShowApiKeyDialog(true);
      } else {
        toast.error(error.message || "Something went wrong");
      }
    },
  });
  const { data, status, error } = agent;

  const isLoading = status === "submitted" || status === "streaming";
  const showKeyNotice = status === "error" && error !== undefined && isAuthError(error);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [data.messages, status]);

  const needsKey = !apiKey && process.env.NODE_ENV !== "development";

  const sendPrompt = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    if (needsKey) {
      setShowApiKeyDialog(true);
      return;
    }
    agent.send({ message: trimmed, clientContext: buildContext() }).catch(() => undefined); // failures surface via status/error/onError
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
          {data.messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="New conversation"
                    onClick={() => agent.reset()}
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
          {data.messages.length === 0 ? (
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
            data.messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner className="size-3" />
              Thinking…
            </div>
          )}
          {showKeyNotice && (
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              The assistant needs a Vercel AI Gateway key —{" "}
              <button type="button" className="underline" onClick={() => setShowApiKeyDialog(true)}>
                add yours
              </button>{" "}
              or set <code className="font-mono">AI_GATEWAY_API_KEY</code> on the server.
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

// -----------------------------------------------------------------------------
// Message rendering — eve's default reducer projects `data.messages` in the
// AI SDK UIMessage convention: text parts plus `dynamic-tool` parts.
// -----------------------------------------------------------------------------

function ChatMessage({ message }: { message: EveMessage }) {
  return (
    <div
      className={cn("flex flex-col gap-1.5", message.role === "user" ? "items-end" : "items-start")}
    >
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;
        if (part.type === "text") {
          return part.text.trim() ? (
            <div
              key={key}
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
        if (part.type === "dynamic-tool") {
          return <ToolChip key={key} part={part} />;
        }
        return null;
      })}
    </div>
  );
}

type DynamicToolPart = Extract<EveMessagePart, { type: "dynamic-tool" }>;

/** Loose view of tool inputs, for the chip label only. */
const toolInputPreviewSchema = z.object({
  updates: z.array(z.unknown()).optional(),
  threadIds: z.array(z.string()).optional(),
  value: z.boolean().optional(),
  unread: z.boolean().optional(),
});

type ToolInputPreview = z.infer<typeof toolInputPreviewSchema>;

type ToolPartDisplay = {
  icon: React.ComponentType<{ className?: string }>;
  active: string;
  done: (input: ToolInputPreview) => string;
};

const TOOL_DISPLAYS: Record<string, ToolPartDisplay> = {
  triage_threads: {
    icon: InboxIcon,
    active: "Triaging threads…",
    done: (input) => `Triaged ${pluralize(input.updates?.length ?? 0, "thread")}`,
  },
  draft_reply: {
    icon: PenLineIcon,
    active: "Drafting a reply…",
    done: () => "Draft placed in composer",
  },
  archive_threads: {
    icon: ArchiveIcon,
    active: "Updating archive state…",
    done: (input) =>
      `${input.value === false ? "Unarchived" : "Archived"} ${pluralize(input.threadIds?.length ?? 0, "thread")}`,
  },
  star_threads: {
    icon: StarIcon,
    active: "Updating stars…",
    done: (input) =>
      `${input.value === false ? "Unstarred" : "Starred"} ${pluralize(input.threadIds?.length ?? 0, "thread")}`,
  },
  mark_threads: {
    icon: MailCheckIcon,
    active: "Updating read state…",
    done: (input) =>
      `Marked ${pluralize(input.threadIds?.length ?? 0, "thread")} as ${input.unread === true ? "unread" : "read"}`,
  },
};

function ToolChip({ part }: { part: DynamicToolPart }) {
  const display = TOOL_DISPLAYS[part.toolName];
  if (!display) return null;

  const done = part.state === "output-available";
  const failed = part.state === "output-error" || part.state === "output-denied";
  const input = toolInputPreviewSchema.safeParse(part.input);
  const label = done
    ? display.done(input.success ? input.data : {})
    : failed
      ? "Tool call failed"
      : display.active;
  const Icon = display.icon;

  return (
    <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
      {done ? (
        <CheckIcon className="size-3" />
      ) : failed ? (
        <XIcon className="size-3" />
      ) : (
        <Icon className="size-3" />
      )}
      {label}
    </div>
  );
}

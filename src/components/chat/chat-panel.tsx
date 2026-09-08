"use client";

import * as React from "react";
import type { MessageStreamEvent, SubagentChildEventStreamEvent } from "eve/client";
import type { EveMessage, EveMessagePart } from "eve/react";
import { useEveAgent } from "eve/react";
import {
  CheckCheckIcon,
  CheckIcon,
  HashIcon,
  KeyIcon,
  PenLineIcon,
  RotateCcwIcon,
  SendIcon,
  SmilePlusIcon,
  SparklesIcon,
  UserRoundIcon,
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
  addReactionPayloadSchema,
  createChannelPayloadSchema,
  draftMessagePayloadSchema,
  markReadPayloadSchema,
  setStatusPayloadSchema,
} from "@/lib/assistant-schemas";
import { cn } from "cn";
import { buildWorkspaceContext } from "@/lib/workspace-context";
import type { WorkspaceContext } from "@/lib/workspace-context";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { ApiKeyDialog, GATEWAY_API_KEY_STORAGE_KEY } from "./api-key-dialog";

const EXAMPLE_PROMPTS = [
  "Catch me up on #engineering",
  "Summarize this thread",
  "Draft a reply to Priya",
  "What did I miss while away?",
];

const pluralize = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

const buildContext = (): WorkspaceContext => {
  const { users, conversations, messages, status, selectedConversationId, openThreadId } =
    useWorkspaceStore.getState();
  return buildWorkspaceContext({
    conversations,
    messages,
    openThreadId,
    selectedConversationId,
    status,
    users,
  });
};

/**
 * BYO-key transport: the stored gateway key rides as a bearer header on
 * every eve request (the channel verifier hands it to the dynamic model
 * resolver). Read from localStorage on every request — eve captures this
 * resolver once at store creation, so React state would go stale.
 */
const resolveAuthHeaders = (): Readonly<Record<string, string>> => {
  if (typeof window === "undefined") {
    return {};
  }
  const key = window.localStorage.getItem(GATEWAY_API_KEY_STORAGE_KEY);
  return key !== null && key.length > 0 ? { authorization: `Bearer ${key}` } : {};
};

// -----------------------------------------------------------------------------
// Tool results -> store mutations
//
// eve streams every tool result as an `action.result` event whose
// `data.result` is `{ kind: "tool-result", toolName, output, isError? }`,
// where `output` is the tool's full `execute` return value. The envelope is
// narrowed on eve's own protocol types; each payload is zod-parsed against
// the shared schemas before touching the store.
// -----------------------------------------------------------------------------

/** `subagent.event` wraps a child session's (unstamped) stream event under `data.event`. */
type AgentStreamEvent = MessageStreamEvent | SubagentChildEventStreamEvent["data"]["event"];

type ToolResult = Extract<
  Extract<AgentStreamEvent, { type: "action.result" }>["data"]["result"],
  { kind: "tool-result" }
>;
type WorkspaceStore = ReturnType<typeof useWorkspaceStore.getState>;

const applyDraftMessage = (store: WorkspaceStore, result: ToolResult): void => {
  const payload = draftMessagePayloadSchema.safeParse(result.output);
  if (!payload.success) {
    return;
  }
  const { conversationId, body } = payload.data;
  if (!store.conversations.some((conversation) => conversation.id === conversationId)) {
    toast.error("The assistant tried to draft into a conversation that no longer exists");
    return;
  }
  store.setDraft(conversationId, body);
  store.selectConversation(conversationId);
  toast.success("Draft ready in the composer");
};

const applyCreateChannel = (store: WorkspaceStore, result: ToolResult): void => {
  const payload = createChannelPayloadSchema.safeParse(result.output);
  if (!payload.success) {
    return;
  }
  // The tool is stateless, so collision and slug validation live here.
  const { name, purpose } = payload.data;
  const created = store.createChannel(name, purpose);
  if (!created.ok) {
    toast.error(
      created.reason === "duplicate"
        ? `#${name} already exists`
        : `"${name}" is not a usable channel name`,
    );
    return;
  }
  toast.success(`Created #${name}`);
};

const applyAddReaction = (store: WorkspaceStore, result: ToolResult): void => {
  const payload = addReactionPayloadSchema.safeParse(result.output);
  if (!payload.success) {
    return;
  }
  const { messageId, emoji } = payload.data;
  if (!store.messages.some((message) => message.id === messageId)) {
    toast.error("The assistant tried to react to a message that no longer exists");
    return;
  }
  store.toggleReaction(messageId, emoji);
  toast.success(`Reacted with ${emoji}`);
};

const applyMarkRead = (store: WorkspaceStore, result: ToolResult): void => {
  const payload = markReadPayloadSchema.safeParse(result.output);
  if (!payload.success) {
    return;
  }
  const known = payload.data.conversationIds.filter((id) =>
    store.conversations.some((conversation) => conversation.id === id),
  );
  if (known.length === 0) {
    return;
  }
  store.markRead(known);
  toast.success(`Marked ${pluralize(known.length, "conversation")} as read`);
};

const applySetStatus = (store: WorkspaceStore, result: ToolResult): void => {
  const payload = setStatusPayloadSchema.safeParse(result.output);
  if (!payload.success) {
    return;
  }
  store.setStatus(payload.data);
  toast.success(`Status set to ${payload.data.emoji} ${payload.data.text}`);
};

const applyToolResult = (event: AgentStreamEvent): void => {
  // Delegation is forbidden by the instructions, but if the model strays,
  // unwrap the child's events so its tool results still reach the store.
  if (event.type === "subagent.event") {
    applyToolResult(event.data.event);
    return;
  }
  if (event.type !== "action.result") {
    return;
  }
  const { status, result } = event.data;
  if (status !== "completed" || result.kind !== "tool-result" || result.isError === true) {
    return;
  }

  const store = useWorkspaceStore.getState();
  switch (result.toolName) {
    case "draft_message": {
      applyDraftMessage(store, result);
      break;
    }
    case "create_channel": {
      applyCreateChannel(store, result);
      break;
    }
    case "add_reaction": {
      applyAddReaction(store, result);
      break;
    }
    case "mark_read": {
      applyMarkRead(store, result);
      break;
    }
    case "set_status": {
      applySetStatus(store, result);
      break;
    }
    default: {
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
  /unauthorized|forbidden|authentication|api.?key|credential|401|403/iu.test(error.message);

// -----------------------------------------------------------------------------
// Message rendering — eve's default reducer projects `data.messages` in the
// AI SDK UIMessage convention: text parts plus `dynamic-tool` parts.
// -----------------------------------------------------------------------------

type DynamicToolPart = Extract<EveMessagePart, { type: "dynamic-tool" }>;

/** Loose view of tool inputs, for the chip label only. */
const toolInputPreviewSchema = z.object({
  conversationIds: z.array(z.string()).optional(),
  emoji: z.string().optional(),
  name: z.string().optional(),
  text: z.string().optional(),
});

type ToolInputPreview = z.infer<typeof toolInputPreviewSchema>;

interface ToolPartDisplay {
  icon: React.ComponentType<{ className?: string }>;
  active: string;
  done: (input: ToolInputPreview) => string;
}

const TOOL_DISPLAYS = {
  add_reaction: {
    active: "Adding a reaction…",
    done: (input) => `Reacted with ${input.emoji ?? "an emoji"}`,
    icon: SmilePlusIcon,
  },
  create_channel: {
    active: "Creating a channel…",
    done: (input) => `Created #${input.name ?? "channel"}`,
    icon: HashIcon,
  },
  draft_message: {
    active: "Drafting a message…",
    done: () => "Draft placed in composer",
    icon: PenLineIcon,
  },
  mark_read: {
    active: "Clearing unreads…",
    done: (input) => `Marked ${pluralize(input.conversationIds?.length ?? 0, "conversation")} read`,
    icon: CheckCheckIcon,
  },
  set_status: {
    active: "Updating your status…",
    done: (input) => `Status: ${input.emoji ?? ""} ${input.text ?? ""}`.trim(),
    icon: UserRoundIcon,
  },
} satisfies Record<string, ToolPartDisplay>;

const isDisplayedTool = (toolName: string): toolName is keyof typeof TOOL_DISPLAYS =>
  toolName in TOOL_DISPLAYS;

const toolDisplay = (toolName: string): ToolPartDisplay | undefined =>
  isDisplayedTool(toolName) ? TOOL_DISPLAYS[toolName] : undefined;

const ToolChip = ({ part }: { part: DynamicToolPart }) => {
  const display = toolDisplay(part.toolName);
  if (!display) {
    return null;
  }

  let label = display.active;
  let Icon = display.icon;
  if (part.state === "output-available") {
    const input = toolInputPreviewSchema.safeParse(part.input);
    label = display.done(input.success ? input.data : {});
    Icon = CheckIcon;
  } else if (part.state === "output-error" || part.state === "output-denied") {
    label = "Tool call failed";
    Icon = XIcon;
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
      <Icon className="size-3" />
      {label}
    </div>
  );
};

const ChatMessage = ({ message }: { message: EveMessage }) => (
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

export interface ChatPanelHandle {
  /** Sends a canned prompt from the shell (the conversation "Summarize" button). */
  send: (prompt: string) => void;
}

interface ChatPanelProps {
  ref?: React.Ref<ChatPanelHandle>;
  onClose: () => void;
}

export const ChatPanel = ({ ref, onClose }: ChatPanelProps) => {
  const [input, setInput] = React.useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = React.useState(false);
  const [apiKey, , removeApiKey] = useLocalStorage(GATEWAY_API_KEY_STORAGE_KEY, "");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const agent = useEveAgent({
    headers: resolveAuthHeaders,
    onError: (error) => {
      if (isAuthError(error)) {
        removeApiKey();
        toast.error("Invalid API key. Please enter a valid Vercel AI Gateway API key.");
        setShowApiKeyDialog(true);
      } else {
        toast.error(error.message || "Something went wrong");
      }
    },
    onEvent: applyToolResult,
  });
  const { data, status, error, send } = agent;

  const isLoading = status === "submitted" || status === "streaming";
  const showKeyNotice = status === "error" && error !== undefined && isAuthError(error);

  /** Idle with an empty transcript is the example-prompt state — nothing to pin to. */
  React.useEffect(() => {
    if (data.messages.length === 0 && status === "ready") {
      return;
    }
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [data.messages, status]);

  const needsKey = !apiKey && process.env.NODE_ENV !== "development";

  const sendPrompt = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) {
        return;
      }
      if (needsKey) {
        setShowApiKeyDialog(true);
        return;
      }
      setInput("");
      try {
        await send(trimmed, { clientContext: buildContext() });
      } catch {
        // Failures surface via status/error/onError.
      }
    },
    [send, isLoading, needsKey],
  );

  React.useImperativeHandle(ref, () => ({ send: sendPrompt }), [sendPrompt]);

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
                Keep up with your workspace by talking to it — catch up on channels, summarize
                threads, draft messages, or clear unreads.
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
              if (needsKey) {
                setShowApiKeyDialog(true);
              }
            }}
            placeholder="Ask about your workspace…"
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
};

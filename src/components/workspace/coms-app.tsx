"use client";

import * as React from "react";
import { SparklesIcon } from "lucide-react";

import { ChatPanel } from "@/components/chat/chat-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { ConversationView } from "./conversation-view";
import { ThreadPane } from "./thread-pane";
import { WorkspaceSidebar } from "./workspace-sidebar";

function AppSkeleton() {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="hidden w-60 shrink-0 flex-col gap-2 border-r p-3 md:flex">
        {Array.from({ length: 9 }, (_, index) => (
          <Skeleton key={index} className="h-7 w-full" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="hidden w-[360px] shrink-0 flex-col gap-3 border-l p-3 lg:flex">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export function ComsApp() {
  const hydrated = useWorkspaceStore((state) => state.hydrated);
  const openThreadId = useWorkspaceStore((state) => state.openThreadId);

  const [chatOpen, setChatOpen] = React.useState(true);
  /**
   * Canned prompts (the "Summarize" header button) travel to the chat panel as
   * a one-shot: the panel sends it and calls back to clear it.
   */
  const [pendingPrompt, setPendingPrompt] = React.useState<string | null>(null);

  React.useEffect(() => {
    void useWorkspaceStore.persist.rehydrate();
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setChatOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const askAssistant = (prompt: string) => {
    setChatOpen(true);
    setPendingPrompt(prompt);
  };

  const showRail = chatOpen || openThreadId !== null;

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4" />
          <span className="text-sm font-semibold tracking-tight">AI Coms</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant={chatOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setChatOpen((open) => !open)}
            aria-pressed={chatOpen}
          >
            <SparklesIcon />
            Assistant
            <KbdGroup className="ml-1 hidden lg:flex">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </Button>
        </div>
      </header>

      {hydrated ? (
        <div className="flex min-h-0 flex-1">
          <div className="hidden w-60 shrink-0 border-r md:block">
            <WorkspaceSidebar />
          </div>
          <div className="min-w-0 flex-1">
            <ConversationView onAskAssistant={askAssistant} />
          </div>
          {showRail && (
            // The thread pane overlays the assistant instead of pushing a
            // fifth column — keeps the assistant mounted (transcript intact).
            <div className="relative hidden w-[360px] shrink-0 border-l lg:block">
              {chatOpen && (
                <ChatPanel
                  onClose={() => setChatOpen(false)}
                  pendingPrompt={pendingPrompt}
                  onPromptSent={() => setPendingPrompt(null)}
                />
              )}
              {openThreadId !== null && (
                <div className="absolute inset-0 bg-background">
                  <ThreadPane />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <AppSkeleton />
      )}
    </div>
  );
}

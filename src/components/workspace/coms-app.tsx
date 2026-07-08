"use client";

import * as React from "react";
import { MenuIcon, SparklesIcon } from "lucide-react";

import { ChatPanel } from "@/components/chat/chat-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
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
  const selectedConversationId = useWorkspaceStore((state) => state.selectedConversationId);

  const [chatOpen, setChatOpen] = React.useState(true);
  /** Below md the sidebar is a slide-over; picking a conversation dismisses it. */
  const [navOpen, setNavOpen] = React.useState(false);
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

  /** Picking a conversation in the slide-over dismisses it. */
  React.useEffect(() => {
    setNavOpen(false);
  }, [selectedConversationId]);

  /**
   * Below lg the rail covers the conversation; below md the slide-over covers
   * it. Mark whatever is underneath `inert` so it leaves the a11y/focus tree.
   */
  const showRail = chatOpen || openThreadId !== null;
  const railIsOverlay = !useMediaQuery("(min-width: 64rem)");
  const navIsOverlay = !useMediaQuery("(min-width: 48rem)");
  const coversConversation = (navOpen && navIsOverlay) || (showRail && railIsOverlay);

  /** The slide-over only exists below md; don't strand `navOpen` on resize. */
  React.useEffect(() => {
    if (!navIsOverlay) setNavOpen(false);
  }, [navIsOverlay]);

  const askAssistant = (prompt: string) => {
    setChatOpen(true);
    setPendingPrompt(prompt);
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setNavOpen((open) => !open)}
          aria-label="Toggle conversations"
          aria-expanded={navOpen}
        >
          <MenuIcon />
        </Button>
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
          {navOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div className="w-60 max-w-[80%] border-r bg-background">
                <WorkspaceSidebar />
              </div>
              <button
                type="button"
                className="flex-1 bg-black/40"
                aria-label="Close conversations"
                onClick={() => setNavOpen(false)}
              />
            </div>
          )}
          <div className="min-w-0 flex-1" inert={coversConversation}>
            <ConversationView onAskAssistant={askAssistant} />
          </div>
          {/*
           * The rail and the ChatPanel stay mounted whenever they are closed —
           * unmounting would tear down the eve session and lose the transcript.
           * The thread pane overlays the assistant for the same reason. Below
           * lg the rail is a full-screen overlay, so the Assistant button and
           * "N replies" never dead-end on small screens.
           */}
          <div
            className={cn(
              "fixed inset-0 z-40 bg-background lg:relative lg:inset-auto lg:z-auto lg:w-[360px] lg:shrink-0 lg:border-l",
              !showRail && "hidden",
            )}
          >
            <div className={cn("h-full", !chatOpen && "hidden")} inert={openThreadId !== null}>
              <ChatPanel
                onClose={() => setChatOpen(false)}
                pendingPrompt={pendingPrompt}
                onPromptSent={() => setPendingPrompt(null)}
              />
            </div>
            {openThreadId !== null && (
              <div className="absolute inset-0 bg-background">
                <ThreadPane />
              </div>
            )}
          </div>
        </div>
      ) : (
        <AppSkeleton />
      )}
    </div>
  );
}

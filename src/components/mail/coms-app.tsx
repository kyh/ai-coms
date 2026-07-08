"use client";

import * as React from "react";
import { SearchIcon, SparklesIcon } from "lucide-react";

import { ChatPanel } from "@/components/chat/chat-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { useThreadStore } from "@/lib/thread-store";
import { MailSidebar } from "./mail-sidebar";
import { ThreadList } from "./thread-list";
import { ThreadView } from "./thread-view";

function AppSkeleton() {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="hidden w-52 shrink-0 flex-col gap-2 border-r p-3 md:flex">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-7 w-full" />
        ))}
      </div>
      <div className="flex w-full shrink-0 flex-col gap-3 border-r p-3 sm:w-80 lg:w-96">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
      <div className="hidden flex-1 flex-col gap-3 p-4 sm:flex">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export function ComsApp() {
  const hydrated = useThreadStore((state) => state.hydrated);
  const search = useThreadStore((state) => state.search);
  const setSearch = useThreadStore((state) => state.setSearch);

  const [chatOpen, setChatOpen] = React.useState(true);

  React.useEffect(() => {
    void useThreadStore.persist.rehydrate();
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

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4" />
          <span className="text-sm font-semibold tracking-tight">AI Coms</span>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search threads…"
            className="h-8 pl-8 text-sm"
            aria-label="Search threads"
          />
        </div>
        <div className="flex items-center gap-1">
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
          <div className="hidden w-52 shrink-0 border-r md:block">
            <MailSidebar />
          </div>
          <div className="w-full shrink-0 border-r sm:w-80 lg:w-96">
            <ThreadList />
          </div>
          <div className="hidden min-w-0 flex-1 sm:block">
            <ThreadView />
          </div>
          {chatOpen && (
            <div className="hidden w-[360px] shrink-0 border-l lg:block">
              <ChatPanel onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>
      ) : (
        <AppSkeleton />
      )}
    </div>
  );
}

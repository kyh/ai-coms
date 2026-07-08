"use client";

import * as React from "react";
import { SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  rows?: number;
  /** Only the conversation composer receives AI drafts, so only it says so. */
  hint?: string;
}

/** Enter sends, Shift+Enter inserts a newline — the chat convention. */
export function MessageComposer({
  value,
  onChange,
  onSend,
  placeholder,
  rows = 2,
  hint,
}: MessageComposerProps) {
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (value.trim().length === 0) return;
    onSend();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim().length === 0) return;
      onSend();
    }
  };

  return (
    <form onSubmit={submit} className="shrink-0 p-3">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className="min-h-0 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="pl-1 text-xs text-muted-foreground">{hint ?? ""}</span>
          <Button
            type="submit"
            size="icon-sm"
            aria-label="Send"
            disabled={value.trim().length === 0}
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </form>
  );
}

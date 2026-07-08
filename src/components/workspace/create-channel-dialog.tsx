"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { slugifyChannelName } from "@/lib/workspace";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChannelDialog({ open, onOpenChange }: CreateChannelDialogProps) {
  const createChannel = useWorkspaceStore((state) => state.createChannel);
  const [name, setName] = React.useState("");
  const [purpose, setPurpose] = React.useState("");

  const slug = slugifyChannelName(name);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = createChannel(name, purpose);
    if (!result.ok) {
      toast.error(
        result.reason === "duplicate"
          ? `#${slug} already exists`
          : "Give the channel a name with at least one letter or number",
      );
      return;
    }
    toast.success(`Created #${slug}`);
    setName("");
    setPurpose("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create a channel</DialogTitle>
            <DialogDescription>
              Channels are where your team talks. They work best around a topic.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Name
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                  #
                </span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="launch-4-12"
                  className="pl-6"
                  autoFocus
                />
              </div>
              {slug.length > 0 && slug !== name.trim().toLowerCase() && (
                <span className="text-xs font-normal text-muted-foreground">
                  Will be created as #{slug}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Purpose
              <Input
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                placeholder="Coordinating the 4.12 release"
              />
            </label>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={slug.length === 0}>
              Create channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

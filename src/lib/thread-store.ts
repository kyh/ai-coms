"use client";

import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { seedThreads } from "@/lib/seed-threads";
import { ME, threadLastActivity, threadSchema, type Priority, type Thread } from "@/lib/thread";

export type Folder = "inbox" | "starred" | "archived";

type TriageUpdate = {
  threadId: string;
  priority: Priority;
  labels: string[];
};

type ThreadStore = {
  threads: Thread[];
  drafts: Record<string, string>;
  hydrated: boolean;
  /** Whether the one-time seed has run — prevents seeds resurrecting after a full clear. */
  seeded: boolean;
  selectedThreadId: string | null;
  folder: Folder;
  activeLabel: string | null;
  search: string;

  setHydrated: () => void;
  selectThread: (threadId: string | null) => void;
  setFolder: (folder: Folder) => void;
  setActiveLabel: (label: string | null) => void;
  setSearch: (search: string) => void;

  setStarred: (threadIds: string[], value: boolean) => void;
  setArchived: (threadIds: string[], value: boolean) => void;
  setUnread: (threadIds: string[], unread: boolean) => void;
  setPriority: (threadId: string, priority: Priority) => void;
  addLabel: (threadId: string, label: string) => void;
  removeLabel: (threadId: string, label: string) => void;
  applyTriage: (updates: TriageUpdate[]) => void;
  setDraft: (threadId: string, draft: string) => void;
  sendReply: (threadId: string) => void;
  seed: () => void;
  resetMailbox: () => void;
};

/**
 * localStorage boundary: every persisted thread is zod-parsed on read and any
 * malformed entry is dropped, so corrupt/tampered storage can't crash
 * downstream consumers.
 */
const persistedStateSchema = z.object({
  threads: z.array(z.unknown()).transform((threads) =>
    threads.flatMap((thread) => {
      const parsed = threadSchema.safeParse(thread);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
  drafts: z.record(z.string(), z.string()).optional(),
  seeded: z.boolean().optional(),
});

const updateThreads = (
  threads: Thread[],
  threadIds: string[],
  update: (thread: Thread) => Thread,
): Thread[] => {
  const ids = new Set(threadIds);
  return threads.map((thread) => (ids.has(thread.id) ? update(thread) : thread));
};

export const useThreadStore = create<ThreadStore>()(
  persist(
    (set, get) => ({
      threads: [],
      drafts: {},
      hydrated: false,
      seeded: false,
      selectedThreadId: null,
      folder: "inbox",
      activeLabel: null,
      search: "",

      setHydrated: () => set({ hydrated: true }),

      selectThread: (threadId) => {
        set({ selectedThreadId: threadId });
        if (threadId) {
          set((state) => ({
            threads: updateThreads(state.threads, [threadId], (thread) => ({
              ...thread,
              unread: false,
            })),
          }));
        }
      },

      setFolder: (folder) => set({ folder, activeLabel: null }),
      setActiveLabel: (activeLabel) => set({ activeLabel }),
      setSearch: (search) => set({ search }),

      setStarred: (threadIds, value) =>
        set((state) => ({
          threads: updateThreads(state.threads, threadIds, (thread) => ({
            ...thread,
            starred: value,
          })),
        })),

      setArchived: (threadIds, value) =>
        set((state) => ({
          threads: updateThreads(state.threads, threadIds, (thread) => ({
            ...thread,
            archived: value,
          })),
        })),

      setUnread: (threadIds, unread) =>
        set((state) => ({
          threads: updateThreads(state.threads, threadIds, (thread) => ({
            ...thread,
            unread,
          })),
        })),

      setPriority: (threadId, priority) =>
        set((state) => ({
          threads: updateThreads(state.threads, [threadId], (thread) => ({
            ...thread,
            priority,
          })),
        })),

      addLabel: (threadId, label) => {
        const normalized = label.trim().toLowerCase();
        if (!normalized) return;
        set((state) => ({
          threads: updateThreads(state.threads, [threadId], (thread) => ({
            ...thread,
            labels: thread.labels.includes(normalized)
              ? thread.labels
              : [...thread.labels, normalized],
          })),
        }));
      },

      removeLabel: (threadId, label) =>
        set((state) => ({
          threads: updateThreads(state.threads, [threadId], (thread) => ({
            ...thread,
            labels: thread.labels.filter((existing) => existing !== label),
          })),
        })),

      applyTriage: (updates) =>
        set((state) => {
          const byId = new Map(updates.map((update) => [update.threadId, update]));
          return {
            threads: state.threads.map((thread) => {
              const update = byId.get(thread.id);
              if (!update) return thread;
              const mergedLabels = [
                ...thread.labels,
                ...update.labels
                  .map((label) => label.trim().toLowerCase())
                  .filter((label) => label && !thread.labels.includes(label)),
              ];
              return { ...thread, priority: update.priority, labels: mergedLabels };
            }),
          };
        }),

      setDraft: (threadId, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [threadId]: draft } })),

      sendReply: (threadId) => {
        const draft = get().drafts[threadId]?.trim();
        if (!draft) return;
        set((state) => {
          const { [threadId]: _sent, ...drafts } = state.drafts;
          return {
            threads: updateThreads(state.threads, [threadId], (thread) => ({
              ...thread,
              messages: [
                ...thread.messages,
                {
                  id: crypto.randomUUID(),
                  from: ME,
                  at: new Date().toISOString(),
                  body: draft,
                },
              ],
            })),
            drafts,
          };
        });
      },

      seed: () =>
        set((state) => ({
          threads: [
            ...state.threads,
            ...seedThreads.filter((seed) => !state.threads.some((t) => t.id === seed.id)),
          ],
          seeded: true,
        })),

      resetMailbox: () =>
        set({
          threads: seedThreads,
          drafts: {},
          seeded: true,
          selectedThreadId: null,
          folder: "inbox",
          activeLabel: null,
          search: "",
        }),
    }),
    {
      name: "ai-coms-mailbox",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        threads: state.threads,
        drafts: state.drafts,
        seeded: state.seeded,
      }),
      merge: (persisted, current) => {
        const parsed = persistedStateSchema.safeParse(persisted);
        if (!parsed.success) return current;
        return {
          ...current,
          threads: parsed.data.threads,
          drafts: parsed.data.drafts ?? {},
          seeded: parsed.data.seeded ?? false,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        if (!state.seeded) state.seed();
        state.setHydrated();
      },
    },
  ),
);

/** Labels across the mailbox, sorted by frequency then name. */
export const allLabels = (threads: Thread[]): { label: string; count: number }[] => {
  const counts = new Map<string, number>();
  for (const thread of threads) {
    if (thread.archived) continue;
    for (const label of thread.labels) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

export const threadsForFolder = (threads: Thread[], folder: Folder): Thread[] => {
  switch (folder) {
    case "inbox":
      return threads.filter((thread) => !thread.archived);
    case "starred":
      return threads.filter((thread) => thread.starred && !thread.archived);
    case "archived":
      return threads.filter((thread) => thread.archived);
  }
};

export const sortByActivity = (threads: Thread[]): Thread[] =>
  [...threads].sort(
    (a, b) => new Date(threadLastActivity(b)).getTime() - new Date(threadLastActivity(a)).getTime(),
  );

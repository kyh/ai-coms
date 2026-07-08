import { StaticChatTransport } from "@loremllm/transport";

import type { ChatUIMessage } from "@/ai/messages/types";
import type { DataPart } from "@/ai/messages/data-parts";

/**
 * Demo mode: a client-side scripted "Triage my inbox" exchange, replayed by
 * StaticChatTransport with no network. Thread ids reference the seed mailbox.
 */

const triageInput: DataPart["triage-threads"] = {
  updates: [
    {
      threadId: "thr-flaky-tests",
      priority: "high",
      labels: ["urgent"],
    },
    {
      threadId: "thr-acme-launch",
      priority: "high",
      labels: ["launch"],
    },
    {
      threadId: "thr-invoice-northwind",
      priority: "med",
      labels: ["action-needed"],
    },
    {
      threadId: "thr-recruiter-vertex",
      priority: "low",
      labels: [],
    },
    {
      threadId: "thr-frontend-digest",
      priority: "none",
      labels: [],
    },
  ],
};

const triageOutput = "Successfully triaged 5 threads.";

export const demoTransport = new StaticChatTransport<ChatUIMessage>({
  chunkDelayMs: [40, 160],
  async *mockResponse() {
    yield { type: "step-start" };

    yield {
      type: "text",
      text: "Scanning your inbox against the triage rubric…",
    };

    // `toolName` drives the UI part type the transport emits (`tool-<name>`).
    yield {
      type: "tool-triageThreads",
      toolName: "triageThreads",
      toolCallId: "call_demo_triage_1",
      state: "input-available",
      input: triageInput,
    };

    yield {
      type: "tool-triageThreads",
      toolName: "triageThreads",
      toolCallId: "call_demo_triage_1",
      state: "output-available",
      input: triageInput,
      output: triageOutput,
    };

    yield {
      type: "data-triage-threads",
      id: "call_demo_triage_1",
      data: triageInput,
    };

    yield { type: "step-start" };

    yield {
      type: "text",
      text: "Done. Two things need you today: the checkout-suite CI escalation is blocking merges (a serial-run PR just needs one approval), and the Acme launch thread is waiting on your confirmation about the lifecycle email pricing before Thursday's go/no-go. The Northwind invoice is due July 15, the Vertex recruiter can wait, and the newsletter is safe to skip.",
    };
  },
});

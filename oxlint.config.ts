import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react, next, antiSlop],
  ignorePatterns: [
    ...core.ignorePatterns,
    ".eve",
    ".workflow-data",
    ".output",
    ".claude",
    ".codex",
  ],
  overrides: [
    {
      files: ["agent/tools/**"],
      rules: {
        // eve registers each tool under its filename slug (`draft_message.ts` -> `draft_message`),
        // and the disableTool sentinels must match the built-in tool names.
        "unicorn/filename-case": ["error", { case: "snakeCase" }],
      },
    },
  ],
  rules: {
    // Sequential awaits in loops are deliberate here (ordered tool calls, rate-limited reads).
    "no-await-in-loop": "off",
  },
});

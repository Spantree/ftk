/**
 * Sequential Thinking MCP Module
 * Zero-configuration reasoning module
 */

import type { Module } from "../types.ts";
import { instructions } from "./instructions.ts";

export const module: Module = {
  metadata: {
    id: "sequential",
    name: "Sequential Thinking",
    description: "Structured, step-by-step reasoning for complex problem-solving and debugging",
    category: "reasoning",
    tier: "default",
    capabilities: ["MCP"],

    installation: {
      method: "npm",
      package: "@modelcontextprotocol/server-sequential-thinking",
    },

    mcp: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      env: {},
    },

    auth: "none",

    probing: {
      enabled: true,
      requires_auth: false,
      timeout_ms: 5000,
    },

    tokenEstimate: 800,
    conflicts: {},
    pricing: [],
  },

  instructions: [
    {
      content: instructions,
    },
  ],
};

/**
 * Context7 MCP Module
 * Code context and documentation search
 */

import type { Module } from "../types.ts";
import { instructions } from "./instructions.ts";


export const module: Module = {
  metadata: {
    id: "context7",
    name: "Context7",
    description: "Search and retrieve code context, documentation, and examples from libraries",
    category: "code-context",
    tier: "optional",
    capabilities: ["MCP"],

    installation: {
      method: "npm",
      package: "context7-mcp-server",
      version: "1.0.0",
    },

    mcp: {
      command: "npx",
      args: ["-y", "context7-mcp-server"],
      env: {},
      tool_filtering: {
        supported: false,
      },
      transport: "stdio",
    },

    auth: "api-key", // Optional - has free tier

    env_vars: [
      {
        name: "CONTEXT7_API_KEY",
        description: "Context7 API key (optional - free tier available without key)",
        required: false,
        secret: true,
      },
    ],

    probing: {
      enabled: true,
      requires_auth: false, // Works without auth on free tier
      timeout_ms: 5000,
    },

    tokenEstimate: 3000,

    conflicts: {
      hard: ["reftools"], // Mutually exclusive with RefTools
    },

    pricing: [],
  },

  instructions: [
    {
      content: instructions,
    },
  ],
};

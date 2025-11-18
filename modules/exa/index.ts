/**
 * Exa MCP Module
 * AI-powered search and deep research
 */

import type { Module } from "../types.ts";
import { instructions } from "./instructions.ts";

export const module: Module = {
  metadata: {
    id: "exa",
    name: "Exa",
    description: "AI-powered search and deep research with neural search capabilities",
    category: "ai-search",
    tier: "default",
    capabilities: ["MCP"],

    installation: {
      method: "npm",
      package: "exa-mcp-server",
      version: "2.1.0", // Pinned for deep research tool support (GitHub issue #66)
    },

    mcp: {
      command: "npx",
      args: ["-y", "exa-mcp-server@2.1.0"],
      env: {},
      tool_filtering: {
        supported: false,
      },
      transport: "stdio",
    },

    auth: "api-key",

    env_vars: [
      {
        name: "EXA_API_KEY",
        description: "Exa API key (get from https://app.exa.ai/api-keys)",
        required: true,
        secret: true,
      },
    ],

    probing: {
      enabled: true,
      requires_auth: true,
      timeout_ms: 5000,
    },

    tokenEstimate: 4000,

    conflicts: {
      soft: ["tavali"], // Users typically choose one AI search provider
    },

    pricing: [],
  },

  instructions: [
    {
      content: instructions,
    },
  ],
};

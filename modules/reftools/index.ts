/**
 * RefTools MCP Module
 * Token-optimized technical documentation search
 */

import type { Module } from "../types.ts";
import { instructions } from "./instructions.ts";


export const module: Module = {
  metadata: {
    id: "reftools",
    name: "RefTools",
    description: "Token-optimized technical documentation search with session-driven exploration",
    category: "code-context",
    tier: "default",
    capabilities: ["MCP"],

    installation: {
      method: "npm",
      package: "ref-tools-mcp",
      version: "latest",
    },

    mcp: {
      command: "npx",
      args: ["-y", "ref-tools-mcp@latest"],
      env: {},
    },

    auth: "api-key",

    env_vars: [
      {
        name: "REF_API_KEY",
        description: "RefTools API key (get from https://ref.tools/signup)",
        required: true,
        secret: true,
      },
    ],

    conflicts: {
      hard: ["context7"], // Mutually exclusive - both provide code documentation/context
    },

    probing: {
      enabled: true,
      requires_auth: true,
      timeout_ms: 10000,
    },

    pricing: [
      {
        name: "Free",
        cost: "$0/month",
        limits: "1000 credits/month",
      },
      {
        name: "Basic",
        cost: "$9/month",
        limits: "5000 credits/month",
      },
      {
        name: "Pro",
        cost: "$49/month",
        limits: "50000 credits/month",
      },
    ],

    tokenEstimate: 800,
  },

  instructions: [
    {
      content: instructions,
    },
  ],
};

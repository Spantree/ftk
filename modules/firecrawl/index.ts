/**
 * Firecrawl MCP Module
 * Web scraping and crawling with AI-powered content extraction
 */

import type { Module } from "../types.ts";
import { instructions } from "./instructions.ts";

export const module: Module = {
  metadata: {
    id: "firecrawl",
    name: "Firecrawl",
    description: "Web scraping and crawling with AI-powered content extraction",
    category: "web-scraping",
    tier: "default",
    capabilities: ["MCP"],

    installation: {
      method: "npm",
      package: "firecrawl-mcp",
      version: "3.5.2",
    },

    mcp: {
      command: "npx",
      args: ["-y", "firecrawl-mcp"],
      env: {},
      tool_filtering: {
        supported: false,
      },
      transport: "stdio",
    },

    auth: "api-key",

    env_vars: [
      {
        name: "FIRECRAWL_API_KEY",
        description: "Firecrawl API key (get from https://www.firecrawl.dev/app/api-keys)",
        required: true,
        secret: true,
      },
    ],

    probing: {
      enabled: true,
      requires_auth: true,
      timeout_ms: 5000,
    },

    tokenEstimate: 3500,

    conflicts: {},

    pricing: [
      {
        name: "Free",
        cost: "$0/month",
        limits: "1,000 credits/month",
      },
      {
        name: "Starter",
        cost: "$19/month",
        limits: "50,000 credits/month",
      },
      {
        name: "Standard",
        cost: "$99/month",
        limits: "500,000 credits/month",
      },
    ],
  },

  instructions: [
    {
      content: instructions,
    },
  ],
};

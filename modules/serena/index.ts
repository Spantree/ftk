/**
 * Serena MCP Module
 * IDE-like semantic code tools for efficient coding operations
 */

import type {
  Module,
  ModuleContext,
  PrecheckResult,
} from "../types.ts";
import { instructions } from "./instructions.ts";

/**
 * Check if a command exists in PATH
 */
async function commandExists(cmd: string): Promise<boolean> {
  try {
    const process = new Deno.Command("which", {
      args: [cmd],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await process.output();
    return success;
  } catch {
    return false;
  }
}

export const module: Module = {
  metadata: {
    id: "serena",
    name: "Serena",
    description:
      "IDE-like semantic code tools for efficient, symbol-level code operations across 16+ languages",
    category: "development-tools",
    tier: "default",
    capabilities: ["MCP", "HOOKS"],

    installation: {
      method: "pypi",
      package: "serena",
    },

    mcp: {
      command: "uv",
      args: ["run", "serena-mcp-server"],
      env: {},
      tool_filtering: {
        supported: false,
      },
      transport: "stdio",
    },

    auth: "none",

    probing: {
      enabled: true,
      requires_auth: false,
      timeout_ms: 5000,
    },

    tokenEstimate: 2000,
    conflicts: {},
    pricing: [],
  },

  hooks: {
    /**
     * Verify uv is installed
     */
    async precheck(_ctx: ModuleContext): Promise<PrecheckResult> {
      const hasUv = await commandExists("uv");

      if (!hasUv) {
        return {
          success: false,
          message:
            "uv not found. Install via: https://docs.astral.sh/uv/getting-started/installation",
        };
      }

      return { success: true };
    },
  },

  instructions: [
    {
      content: instructions,
    },
  ],
};

/**
 * Basic Memory MCP Module
 * Local-first knowledge management with markdown notes
 */

import { basename } from "@std/path";
import type {
  ConfigurationResult,
  InstallResult,
  Module,
  ModuleContext,
  PrecheckResult,
} from "../types.ts";
import { buildBaseEnv } from "../types.ts";
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

/**
 * Check if Basic Memory project exists
 */
async function projectExists(projectName: string): Promise<boolean> {
  try {
    const process = new Deno.Command("uvx", {
      args: ["basic-memory", "project", "list"],
      stdout: "piped",
      stderr: "piped",
    });
    const { stdout, success } = await process.output();

    if (!success) return false;

    const output = new TextDecoder().decode(stdout);
    return output.includes(projectName);
  } catch {
    return false;
  }
}

export const module: Module = {
  metadata: {
    id: "basic-memory",
    name: "Basic Memory",
    description:
      "Local-first knowledge management with markdown notes, search, and canvas visualization",
    category: "knowledge-management",
    tier: "default",
    capabilities: ["MCP", "HOOKS"],

    installation: {
      method: "pypi",
      package: "basic-memory",
    },

    mcp: {
      command: "uvx",
      args: ["basic-memory", "mcp"],
      env: {},
      tool_filtering: {
        supported: false,
      },
      transport: "stdio",
    },

    auth: "none",

    env_vars: [
      {
        name: "BASIC_MEMORY_KEBAB_FILENAMES",
        description: "Use kebab-case for filenames instead of spaces",
        default: "true",
        required: false,
        secret: false,
      },
      {
        name: "BASIC_MEMORY_MCP_PROJECT",
        description: "Basic Memory project name (dynamically set to project folder name)",
        required: false,
        secret: false,
      },
    ],

    probing: {
      enabled: true,
      requires_auth: false,
      timeout_ms: 5000,
    },

    tokenEstimate: 2500,
    conflicts: {},
    pricing: [],
  },

  hooks: {
    /**
     * Verify uvx is installed
     */
    async precheck(_ctx: ModuleContext): Promise<PrecheckResult> {
      const hasUvx = await commandExists("uvx");

      if (!hasUvx) {
        return {
          success: false,
          message:
            "uvx not found. Install via: https://docs.astral.sh/uv/getting-started/installation",
        };
      }

      return { success: true };
    },

    /**
     * Check if Basic Memory project exists, prompt to create if not
     */
    async configure(ctx: ModuleContext): Promise<ConfigurationResult> {
      // Get project name from folder
      const projectName = basename(ctx.projectDir);

      // Check if project exists
      const exists = await projectExists(projectName);

      if (exists) {
        ctx.log.info(`Basic Memory project '${projectName}' already exists`);
        return { success: true };
      }

      // Project doesn't exist - prompt user
      ctx.log.info(`Basic Memory project '${projectName}' not found`);
      ctx.log.info("Options:");
      ctx.log.info("  1. Create project automatically");
      ctx.log.info("  2. Show manual command (for later)");
      ctx.log.info("  3. Skip (Basic Memory will not be configured)");

      // For now, just show the manual command
      // TODO: Add interactive prompts when ftk init supports them
      ctx.log.info("");
      ctx.log.info("To create manually, run:");
      ctx.log.info(`  uvx basic-memory project create ${projectName} ${ctx.projectDir}`);
      ctx.log.info("");

      // Store project name for install()
      ctx.config.set("projectName", projectName);

      return { success: true };
    },

    /**
     * Generate MCP configuration
     */
    install(ctx: ModuleContext): Promise<InstallResult> {
      const projectName = ctx.config.get("projectName") as string || basename(ctx.projectDir);

      // Build base env from env_vars declarations
      const baseEnv = buildBaseEnv(ctx.metadata.env_vars);

      // Override dynamic values
      const env = {
        ...baseEnv,
        BASIC_MEMORY_MCP_PROJECT: projectName,
      };

      // Build MCP config
      const mcpConfig = {
        command: "uvx",
        args: [
          "basic-memory",
          "mcp",
        ],
        env,
      };

      ctx.log.info(`Configured Basic Memory for project: ${projectName}`);

      return Promise.resolve({
        success: true,
        mcpConfig,
      });
    },
  },

  instructions: [
    {
      content: instructions,
    },
  ],
};

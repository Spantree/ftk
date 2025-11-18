/**
 * Basic Memory MCP Server
 */

import { join } from "@std/path";
import { BaseMCPServer } from "../../../src/lib/base-server.ts";
import type { DependencyRequirement, SecretRequirement } from "../../../src/lib/base-server.ts";
import type {
  ConfigureResult,
  LifecycleContext,
  ServerMetadata,
} from "../../../src/types/lifecycle.ts";
import claudeMdContent from "./claude.md" with { type: "text" };

export class BasicMemoryServer extends BaseMCPServer {
  override metadata: ServerMetadata = {
    id: "basic-memory",
    name: "Basic Memory",
    description: "Persistent memory and note-taking capabilities for Claude Code",
    category: "core",
    packageName: "basic-memory",
    packageRegistry: "pypi",
    homepage: "https://github.com/basicmachines-co/basic-memory",
  };

  protected override getDependencies(): DependencyRequirement[] {
    return [
      {
        command: "python3",
        name: "Python",
        minVersion: "3.10.0",
      },
      {
        command: "uv",
        name: "uv",
      },
    ];
  }

  override getSecrets(): SecretRequirement[] {
    // Basic Memory doesn't require any API keys
    return [];
  }

  /**
   * Override configure to handle project initialization
   */
  override async configure(ctx: LifecycleContext): Promise<ConfigureResult> {
    try {
      // Get the project name from the current directory
      const cwd = Deno.cwd();
      const projectName = cwd.split("/").pop() || "fluent-toolkit";

      ctx.info(`Setting up Basic Memory project: ${projectName}`);

      // Check if project already exists
      const listCmd = new Deno.Command("uvx", {
        args: ["basic-memory", "project", "list"],
        stdout: "piped",
        stderr: "piped",
      });

      const listOutput = await listCmd.output();
      const projectList = new TextDecoder().decode(listOutput.stdout);

      if (projectList.includes(projectName)) {
        ctx.success(`Basic Memory project "${projectName}" already exists`);
      } else {
        // Create the project
        ctx.info("Initializing Basic Memory project...");

        const projectDir = join(cwd, "context", "basic-memory");

        const addCmd = new Deno.Command("uvx", {
          args: [
            "basic-memory",
            "project",
            "add",
            projectName,
            projectDir,
          ],
          stdout: "piped",
          stderr: "piped",
        });

        const addOutput = await addCmd.output();

        if (!addOutput.success) {
          const error = new TextDecoder().decode(addOutput.stderr);
          return {
            success: false,
            message: `Failed to create Basic Memory project: ${error}`,
          };
        }

        ctx.success(`Created Basic Memory project "${projectName}" at ${projectDir}`);
      }

      return {
        success: true,
        message: "Basic Memory project configured successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to configure Basic Memory: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  protected override generateMcpConfig(_secrets: Record<string, string>, version?: string) {
    // Get the project name from the current directory
    const cwd = Deno.cwd();
    const projectName = cwd.split("/").pop() || "fluent-toolkit";

    // Build package spec with optional version pinning (uvx format: package==version)
    const packageSpec = version ? `basic-memory==${version}` : "basic-memory";

    return {
      command: "uvx",
      args: [
        packageSpec,
        "mcp",
        `--project=${projectName}`,
      ],
    };
  }

  override getClaudeMdContent(): string {
    return claudeMdContent;
  }
}

export default new BasicMemoryServer();

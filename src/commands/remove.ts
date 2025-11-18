/**
 * Remove command - Remove an MCP module from current project
 */

import { ConfigManager } from "../core/config.ts";
import { Prompts } from "../ui/prompts.ts";
import { join } from "@std/path";

export class RemoveCommand {
  static async execute(moduleId: string): Promise<void> {
    try {
      Prompts.info(`\nRemoving ${moduleId}...`);

      // 1. Check if project is initialized
      const isInitialized = await ConfigManager.isProjectInitialized();
      if (!isInitialized) {
        Prompts.error("Project not initialized. Nothing to remove.");
        return;
      }

      // 2. Check if module is installed
      const projectConfig = await ConfigManager.getProjectConfig();
      if (!projectConfig) {
        Prompts.error("Could not load project configuration.");
        return;
      }

      if (!projectConfig.servers[moduleId]) {
        Prompts.warning(`Module '${moduleId}' is not installed.`);
        Prompts.info("\nCurrently installed modules:");
        const installedIds = Object.keys(projectConfig.servers);
        if (installedIds.length === 0) {
          console.log("  (none)");
        } else {
          for (const id of installedIds) {
            console.log(`  • ${id}`);
          }
        }
        return;
      }

      const projectDir = Deno.cwd();

      // 3. Remove from .mcp.json
      const mcpConfigPath = join(projectDir, ".mcp.json");
      try {
        const mcpConfig = JSON.parse(await Deno.readTextFile(mcpConfigPath));
        delete mcpConfig.mcpServers[moduleId];
        await Deno.writeTextFile(
          mcpConfigPath,
          JSON.stringify(mcpConfig, null, 2) + "\n",
        );
      } catch (error) {
        Prompts.warning(
          `Could not update .mcp.json: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // 4. Remove from CLAUDE.md
      const claudeMdPath = join(projectDir, "CLAUDE.md");
      try {
        let claudeMd = await Deno.readTextFile(claudeMdPath);

        // Remove the section
        const sectionRegex = new RegExp(
          `\n?---\n\n<!-- ftk:begin:mcp:${moduleId} -->.*?<!-- ftk:end:mcp:${moduleId} -->\n?`,
          "s",
        );
        claudeMd = claudeMd.replace(sectionRegex, "");

        // Clean up any double separators
        claudeMd = claudeMd.replace(/\n---\n\n---\n/g, "\n---\n");

        await Deno.writeTextFile(claudeMdPath, claudeMd);
      } catch (error) {
        Prompts.warning(
          `Could not update CLAUDE.md: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // 5. Remove cached instruction files
      const moduleCacheDir = join(projectDir, ".ftk", "modules", moduleId);
      try {
        await Deno.remove(moduleCacheDir, { recursive: true });
      } catch (error) {
        // Ignore if directory doesn't exist
        if (!(error instanceof Deno.errors.NotFound)) {
          Prompts.warning(
            `Could not remove cached files: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      // 6. Remove from project config
      delete projectConfig.servers[moduleId];
      await ConfigManager.saveProjectConfig(projectConfig);

      Prompts.success(`${moduleId} removed successfully`);

      // Note about env vars
      console.log(
        "\nNote: Environment variables in .env.ftk* were not removed.",
      );
      console.log("You may want to clean them up manually if no longer needed.");
    } catch (error) {
      Prompts.error(
        `Remove error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

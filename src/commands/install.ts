/**
 * Install command - Add an MCP module to current project
 */

import { ServerRegistry } from "../core/registry.ts";
import { ConfigManager } from "../core/config.ts";
import { Prompts } from "../ui/prompts.ts";
import { DefaultLifecycleContext } from "../lib/lifecycle-context.ts";
import { collectEnvVars } from "./helpers/env-collection.ts";
import { mergeEnvFile } from "../utils/env-files.ts";
import { cacheInstructions } from "../core/module-cache.ts";
import { getModule, hasConflict } from "../../modules/index.ts";
import { join } from "@std/path";

interface InstallOptions {
  yes?: boolean;
}

export class InstallCommand {
  static async execute(moduleId: string, options: InstallOptions = {}): Promise<void> {
    try {
      Prompts.info(`\nInstalling ${moduleId}...`);

      // 1. Check if project is initialized
      const isInitialized = await ConfigManager.isProjectInitialized();
      if (!isInitialized) {
        Prompts.error("Project not initialized. Run 'ftk init' first.");
        return;
      }

      // 2. Check if module exists
      const server = await ServerRegistry.getById(moduleId);
      if (!server) {
        Prompts.error(`Module '${moduleId}' not found in registry.`);
        Prompts.info("\nAvailable modules:");
        const allServers = await ServerRegistry.getAll();
        for (const s of allServers) {
          console.log(`  • ${s.metadata.id} - ${s.metadata.name}`);
        }
        return;
      }

      // 3. Check if module is already installed
      const projectConfig = await ConfigManager.getProjectConfig();
      if (!projectConfig) {
        Prompts.error("Could not load project configuration.");
        return;
      }

      if (projectConfig.servers[moduleId]) {
        Prompts.warning(`Module '${server.metadata.name}' is already installed.`);

        if (options.yes) {
          Prompts.info("Skipping...");
          return;
        }

        const shouldReinstall = await Prompts.confirm(
          "Reinstall anyway?",
          false,
        );
        if (!shouldReinstall) {
          return;
        }
      }

      // 4. Check for conflicts with installed modules
      const installedIds = Object.keys(projectConfig.servers);
      const module = await getModule(moduleId);

      if (module) {
        for (const installedId of installedIds) {
          const installedModule = await getModule(installedId);
          if (!installedModule) continue;

          const conflict = hasConflict(module, installedModule);
          if (conflict.hard) {
            Prompts.warning(
              `Hard conflict: ${module.metadata.name} conflicts with installed ${installedModule.metadata.name}`,
            );
            console.log("These modules are mutually exclusive.");

            if (options.yes) {
              Prompts.info("Installing anyway due to --yes flag...");
            } else {
              const proceed = await Prompts.confirm(
                "Install anyway?",
                false,
              );
              if (!proceed) {
                return;
              }
            }
          } else if (conflict.soft && !options.yes) {
            Prompts.warning(
              `Soft conflict: ${module.metadata.name} has overlapping functionality with ${installedModule.metadata.name}`,
            );
            const proceed = await Prompts.confirm(
              "Continue anyway?",
              true,
            );
            if (!proceed) {
              return;
            }
          }
        }
      }

      // 5. Run lifecycle
      Prompts.info(`\nConfiguring ${server.metadata.name}...`);

      const ctx = new DefaultLifecycleContext();
      const projectDir = Deno.cwd();

      // Precheck
      if (server.precheck) {
        console.log("⏳ Checking dependencies...");
        const precheckResult = await server.precheck(ctx);
        if (!precheckResult.success) {
          Prompts.error(`Dependency check failed: ${precheckResult.message || "Unknown error"}`);
          return;
        }
      }

      // Configure (collect env vars)
      console.log("⏳ Collecting configuration...");
      const { secrets, nonSecrets, needsUserInput } = await collectEnvVars(
        server.metadata.name,
        module?.metadata.env_vars,
        options.yes,
        projectDir,
      );

      // Update env files
      if (Object.keys(nonSecrets).length > 0) {
        await mergeEnvFile(join(projectDir, ".env.ftk"), nonSecrets);
      }
      if (Object.keys(secrets).length > 0) {
        await mergeEnvFile(join(projectDir, ".env.ftk.secrets"), secrets);
      }

      // Install (generate MCP config)
      console.log("⏳ Generating configuration...");
      const installResult = await server.install(ctx);
      if (!installResult.success) {
        Prompts.error(`Installation failed: ${installResult.message || "Unknown error"}`);
        return;
      }

      // 6. Update .mcp.json
      const mcpConfigPath = join(projectDir, ".mcp.json");
      const mcpConfig = JSON.parse(await Deno.readTextFile(mcpConfigPath));

      mcpConfig.mcpServers[moduleId] = installResult.mcpConfig;

      await Deno.writeTextFile(
        mcpConfigPath,
        JSON.stringify(mcpConfig, null, 2) + "\n",
      );

      // 7. Update CLAUDE.md
      const claudeMdPath = join(projectDir, "CLAUDE.md");
      let claudeMd = await Deno.readTextFile(claudeMdPath);

      // Remove existing section if reinstalling
      const sectionRegex = new RegExp(
        `<!-- ftk:begin:mcp:${moduleId} -->.*?<!-- ftk:end:mcp:${moduleId} -->`,
        "s",
      );
      claudeMd = claudeMd.replace(sectionRegex, "");

      // Add new section
      const claudeIncludes = server.getClaudeMdContent();
      const section =
        `\n---\n\n<!-- ftk:begin:mcp:${moduleId} -->\n${claudeIncludes}\n<!-- ftk:end:mcp:${moduleId} -->`;

      claudeMd = claudeMd.trimEnd() + section + "\n";
      await Deno.writeTextFile(claudeMdPath, claudeMd);

      // 8. Cache instruction files
      if (module) {
        // Pass all installed module IDs (including the one being installed) for polymorphic instruction resolution
        const allModuleIds = [...installedIds, moduleId];
        await cacheInstructions(projectDir, module, allModuleIds);
      }

      // 9. Update project config
      projectConfig.servers[moduleId] = {
        source: "project",
      };
      await ConfigManager.saveProjectConfig(projectConfig);

      // 10. Validate (optional)
      if (server.validate) {
        const validateResult = await server.validate(ctx);
        if (!validateResult.success) {
          Prompts.warning(`Validation warning: ${validateResult.message || "Unknown error"}`);
        }
      }

      Prompts.success(`${server.metadata.name} installed successfully`);

      // Show post-install instructions if needed
      if (needsUserInput.length > 0) {
        console.log("\n⚠️  Configuration Required\n");
        console.log("The following environment variables need to be configured:\n");

        for (const varInfo of needsUserInput) {
          const fileLocation = varInfo.secret ? ".env.ftk.secrets" : ".env.ftk";
          const placeholder = `<your-${varInfo.name.toLowerCase().replace(/_/g, "-")}>`;
          console.log(`  • ${varInfo.name} (${varInfo.secret ? "secret" : "non-secret"})`);
          console.log(`    Description: ${varInfo.description}`);
          console.log(`    File: ${fileLocation}`);
          console.log(`    Replace: ${placeholder}\n`);
        }
        console.log(
          "After updating these values, restart Claude Code to load the new configuration.",
        );
      }
    } catch (error) {
      Prompts.error(
        `Installation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

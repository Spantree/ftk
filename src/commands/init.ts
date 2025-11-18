/**
 * Init Command
 * Interactive wizard for setting up MCP servers using lifecycle methods
 */

import { basename, join } from "@std/path";
import { ConfigManager } from "../core/config.ts";
import { ServerRegistry } from "../core/registry.ts";
import { SecretsManager } from "../core/secrets.ts";
import { ClaudeMdManager } from "../core/claude-md.ts";
import { ContextDirManager } from "../core/context-dir.ts";
import { Prompts } from "../ui/prompts.ts";
import { DefaultLifecycleContext } from "../lib/lifecycle-context.ts";
import { cacheInstructions, updateCachedTokens } from "../core/module-cache.ts";
import { probeMCPServer } from "../core/mcp-probe.ts";
import { estimateTokens } from "../utils/token-counter.ts";
import { ensureMcpServersEnabled } from "../utils/claude-settings.ts";
import {
  checkClaudeCodeInstallation,
  checkForUpgrade,
  clearVersionCache,
  getInstallationInstructions,
  getInstallCommand,
  getUpgradeCommand,
  MIN_CLAUDE_VERSION,
} from "../utils/claude-version.ts";
import { getVersionChanges } from "../utils/changelog.ts";
import { collectEnvVars } from "./helpers/env-collection.ts";
import { mergeEnvFile } from "../utils/env-files.ts";
import { getModule, hasConflict } from "../../modules/index.ts";
import type { InitOptions, MCPServerEntry, MCPServerModule } from "../types/index.ts";

export class InitCommand {
  /**
   * Execute the init command with new lifecycle-based approach
   */
  static async execute(options: InitOptions = {}): Promise<void> {
    try {
      Prompts.info("Welcome to Fluent Toolkit!");
      Prompts.info("From the Fluent Workshop - https://fluentwork.shop");

      // 1. Pre-flight check: Verify Claude Code installation
      if (!options.skipChecks) {
        Prompts.progress("Checking Claude Code installation");
        const versionCheck = await checkClaudeCodeInstallation();

        // Scenario 1: Not installed
        if (!versionCheck.installed) {
          Prompts.error("Claude Code is not installed");

          const installCmd = getInstallCommand(); // Synchronous now

          if (installCmd && !options.yes) {
            // Offer automatic installation
            console.log("\nWould you like to install Claude Code now?");
            console.log(`Command to run: ${installCmd}\n`);

            const shouldInstall = await Prompts.confirm(
              "Install Claude Code?",
              false,
            );

            if (shouldInstall) {
              Prompts.progress("Installing Claude Code");

              try {
                // Parse command to avoid shell injection
                const [command, ...args] = installCmd.split(/\s+/);
                const installCommand = new Deno.Command(command, {
                  args,
                  stdout: "inherit",
                  stderr: "inherit",
                });

                const { code } = await installCommand.output();

                if (code === 0) {
                  Prompts.success("Claude Code installed successfully");

                  // Clear cache and re-check
                  clearVersionCache();
                  const recheckResult = await checkClaudeCodeInstallation();

                  if (recheckResult.installed && recheckResult.meetsRequirements) {
                    Prompts.success(`Claude Code ${recheckResult.version} is ready`);
                  } else {
                    Prompts.warning("Installation completed but version check failed");
                    console.log("Please verify the installation and try again.\n");
                    return;
                  }
                } else {
                  Prompts.error("Installation failed");
                  console.log("\nPlease install manually:");
                  console.log(getInstallationInstructions());
                  return;
                }
              } catch (error) {
                Prompts.error(
                  `Installation error: ${error instanceof Error ? error.message : String(error)}`,
                );
                console.log("\nPlease install manually:");
                console.log(getInstallationInstructions());
                return;
              }
            } else {
              console.log(getInstallationInstructions());
              console.log("\nAfter installing Claude Code, run 'ftk init' again.");
              console.log("Or use 'ftk init --skip-checks' to bypass this check.\n");
              return;
            }
          } else {
            // No automatic install available or --no-prompt mode
            console.log(getInstallationInstructions());
            console.log("\nAfter installing Claude Code, run 'ftk init' again.");
            console.log("Or use 'ftk init --skip-checks' to bypass this check.\n");
            return;
          }
        } // Scenario 2: Outdated version
        else if (!versionCheck.meetsRequirements) {
          Prompts.warning(
            `Claude Code version ${versionCheck.version} is outdated (minimum: v${MIN_CLAUDE_VERSION})`,
          );

          const upgradeCmd = await getUpgradeCommand();

          if (upgradeCmd && !options.yes && versionCheck.version) {
            // Fetch and show changelog
            const upgradeCheck = await checkForUpgrade(versionCheck.version);

            console.log("\nWould you like to upgrade Claude Code now?");
            console.log(`Command to run: ${upgradeCmd}`);

            // Show changelog if available
            if (upgradeCheck.latestVersion) {
              Prompts.progress("Fetching changelog");
              const changelog = await getVersionChanges(
                versionCheck.version,
                upgradeCheck.latestVersion,
              );

              if (changelog) {
                console.log("\n📋 What's new:");
                console.log(changelog);
              }
            }

            console.log();

            const shouldUpgrade = await Prompts.confirm(
              "Upgrade Claude Code?",
              false,
            );

            if (shouldUpgrade) {
              Prompts.progress("Upgrading Claude Code");

              try {
                // Parse command to avoid shell injection
                const [command, ...args] = upgradeCmd.split(/\s+/);
                const upgradeCommand = new Deno.Command(command, {
                  args,
                  stdout: "inherit",
                  stderr: "inherit",
                });

                const { code } = await upgradeCommand.output();

                if (code === 0) {
                  Prompts.success("Claude Code upgraded successfully");

                  // Clear cache and re-check
                  clearVersionCache();
                  const recheckResult = await checkClaudeCodeInstallation();

                  if (recheckResult.meetsRequirements) {
                    Prompts.success(`Claude Code ${recheckResult.version} is ready`);
                  } else {
                    Prompts.warning(
                      "Upgrade completed but version still doesn't meet requirements",
                    );
                    console.log("Please verify the upgrade and try again.\n");

                    const shouldContinue = await Prompts.confirm(
                      "Continue anyway?",
                      false,
                    );

                    if (!shouldContinue) {
                      Prompts.info("Setup cancelled");
                      return;
                    }
                  }
                } else {
                  Prompts.error("Upgrade failed");
                  console.log("\nPlease upgrade manually:");
                  console.log(getInstallationInstructions());

                  const shouldContinue = await Prompts.confirm(
                    "Continue with current version?",
                    false,
                  );

                  if (!shouldContinue) {
                    Prompts.info("Setup cancelled");
                    return;
                  }
                }
              } catch (error) {
                Prompts.error(
                  `Upgrade error: ${error instanceof Error ? error.message : String(error)}`,
                );
                console.log("\nPlease upgrade manually:");
                console.log(getInstallationInstructions());

                const shouldContinue = await Prompts.confirm(
                  "Continue with current version?",
                  false,
                );

                if (!shouldContinue) {
                  Prompts.info("Setup cancelled");
                  return;
                }
              }
            } else {
              console.log("\nSome features may not work correctly with older versions.");

              const shouldContinue = await Prompts.confirm(
                "Continue anyway?",
                false,
              );

              if (!shouldContinue) {
                Prompts.info("Setup cancelled");
                return;
              }
            }
          } else {
            // No automatic upgrade available or --no-prompt mode
            console.log(getInstallationInstructions());
            console.log("\nSome features may not work correctly with older versions.");

            if (!options.yes) {
              const shouldContinue = await Prompts.confirm(
                "Continue anyway?",
                false,
              );

              if (!shouldContinue) {
                Prompts.info("Setup cancelled");
                return;
              }
            }
          }
        } // Scenario 3: Up to date - check for upgrades
        else {
          Prompts.success(`Claude Code ${versionCheck.version} detected`);

          // Check for available upgrades
          if (versionCheck.version) {
            const upgradeCheck = await checkForUpgrade(versionCheck.version);

            if (upgradeCheck.available && upgradeCheck.latestVersion) {
              Prompts.info(`Newer version available: ${upgradeCheck.latestVersion}`);

              const upgradeCmd = await getUpgradeCommand();

              if (upgradeCmd && !options.yes) {
                console.log(`\nCommand to upgrade: ${upgradeCmd}`);

                // Show changelog if available
                Prompts.progress("Fetching changelog");
                const changelog = await getVersionChanges(
                  versionCheck.version,
                  upgradeCheck.latestVersion,
                );

                if (changelog) {
                  console.log("\n📋 What's new:");
                  console.log(changelog);
                }

                console.log();

                const shouldUpgrade = await Prompts.confirm(
                  "Upgrade to latest version?",
                  false,
                );

                if (shouldUpgrade) {
                  Prompts.progress("Upgrading Claude Code");

                  try {
                    // Parse command to avoid shell injection
                    const [command, ...args] = upgradeCmd.split(/\s+/);
                    const upgradeCommand = new Deno.Command(command, {
                      args,
                      stdout: "inherit",
                      stderr: "inherit",
                    });

                    const { code } = await upgradeCommand.output();

                    if (code === 0) {
                      Prompts.success(`Upgraded to Claude Code ${upgradeCheck.latestVersion}`);
                      clearVersionCache();
                    } else {
                      Prompts.warning("Upgrade failed - continuing with current version");
                    }
                  } catch (error) {
                    Prompts.warning(
                      `Upgrade error: ${error instanceof Error ? error.message : String(error)}`,
                    );
                    Prompts.info("Continuing with current version");
                  }
                }
              }
            }
          }
        }
      }

      // 2. Check if already initialized
      const isInitialized = await ConfigManager.isProjectInitialized();
      if (isInitialized && !options.force) {
        if (options.yes) {
          Prompts.info("Project already initialized (use --force to override)");
          return;
        }

        const shouldContinue = await Prompts.confirm(
          "This project is already initialized. Continue anyway?",
          false,
        );

        if (!shouldContinue) {
          Prompts.info("Initialization cancelled");
          return;
        }
      }

      // 3. Get available servers
      const allServers = await ServerRegistry.getAll();
      const coreServers = await ServerRegistry.getCore();
      const optionalServers = await ServerRegistry.getOptional();

      Prompts.info(
        `Found ${coreServers.length} core servers and ${optionalServers.length} optional servers`,
      );

      // 4. Module selection
      let selectedServers: MCPServerModule[];

      if (options.modules && options.modules.length > 0) {
        // Use provided module IDs (overrides defaults)
        const serverPromises = options.modules.map((id) => ServerRegistry.getById(id));
        const resolvedServers = await Promise.all(serverPromises);
        selectedServers = resolvedServers.filter(
          (s): s is MCPServerModule => s !== undefined,
        );

        if (selectedServers.length === 0) {
          Prompts.warning("No valid modules selected. Exiting.");
          return;
        }
      } else if (options.yes || options.include || options.exclude) {
        // Start with core modules and apply include/exclude
        const selectedIds = new Set(coreServers.map((s) => s.metadata.id));

        // Apply excludes first
        if (options.exclude && options.exclude.length > 0) {
          for (const id of options.exclude) {
            selectedIds.delete(id);
          }
        }

        // Apply includes and handle conflicts
        const autoExcluded: Array<{ included: string; excluded: string }> = [];
        if (options.include && options.include.length > 0) {
          for (const includeId of options.include) {
            selectedIds.add(includeId);

            // Check for hard conflicts with existing selected modules
            const includeModule = await getModule(includeId);
            if (includeModule) {
              const conflictingIds = includeModule.metadata.conflicts?.hard || [];

              for (const conflictId of conflictingIds) {
                if (selectedIds.has(conflictId)) {
                  // Auto-exclude the conflicting default module
                  selectedIds.delete(conflictId);
                  autoExcluded.push({
                    included: includeModule.metadata.name,
                    excluded: (await getModule(conflictId))?.metadata.name || conflictId,
                  });
                }
              }
            }
          }
        }

        // Show auto-exclusion warnings
        if (autoExcluded.length > 0) {
          Prompts.warning("Auto-excluded conflicting defaults:");
          for (const { included, excluded } of autoExcluded) {
            console.log(`  • Excluded ${excluded} (conflicts with ${included})`);
          }
          console.log();
        }

        // Resolve server modules
        const serverPromises = Array.from(selectedIds).map((id) => ServerRegistry.getById(id));
        const resolvedServers = await Promise.all(serverPromises);
        selectedServers = resolvedServers.filter(
          (s): s is MCPServerModule => s !== undefined,
        );

        Prompts.info(
          `Installing modules: ${selectedServers.map((s) => s.metadata.name).join(", ")}`,
        );
      } else {
        // Interactive selection
        const selectedIds = await Prompts.multiSelect(
          "Select MCP modules to install:",
          allServers.map((s) => ({
            id: s.metadata.id,
            name: s.metadata.name,
            description: s.metadata.description,
            category: s.metadata.category,
          })) as Array<{
            id: string;
            name: string;
            description: string;
            category: string;
          }>,
        );

        const serverPromises = selectedIds.map((id) => ServerRegistry.getById(id));
        const resolvedServers = await Promise.all(serverPromises);
        selectedServers = resolvedServers.filter(
          (s): s is MCPServerModule => s !== undefined,
        );
      }

      if (selectedServers.length === 0) {
        Prompts.warning("No modules selected. Exiting.");
        return;
      }

      // 4.5. Check for conflicts between selected modules
      const serverModules = await Promise.all(
        selectedServers.map((s) => getModule(s.metadata.id)),
      );
      const validModules = serverModules.filter((m): m is NonNullable<typeof m> => m !== null);

      // Collect conflicts to show warnings later
      const hardConflicts: Array<[string, string]> = [];
      const softConflicts: Array<[string, string]> = [];

      for (let i = 0; i < validModules.length; i++) {
        for (let j = i + 1; j < validModules.length; j++) {
          const conflict = hasConflict(validModules[i], validModules[j]);

          if (conflict.hard) {
            hardConflicts.push([
              validModules[i].metadata.name,
              validModules[j].metadata.name,
            ]);
          } else if (conflict.soft) {
            softConflicts.push([
              validModules[i].metadata.name,
              validModules[j].metadata.name,
            ]);
          }
        }
      }

      // Handle hard conflicts
      if (hardConflicts.length > 0) {
        const explicitlyIncluded = options.include && options.include.length > 0;

        if (explicitlyIncluded) {
          // User explicitly asked for conflicting modules - warn but continue
          Prompts.warning("Detected hard conflicts between modules:");
          for (const [mod1, mod2] of hardConflicts) {
            console.log(`  • ${mod1} ↔ ${mod2}`);
          }
          console.log(
            "\nThese modules are mutually exclusive but will be installed because you explicitly requested them.",
          );
        } else {
          // Auto-selected - block installation
          Prompts.error("Hard conflicts detected:");
          for (const [mod1, mod2] of hardConflicts) {
            console.log(`  • ${mod1} ↔ ${mod2}`);
          }
          console.log(
            "\nThese modules cannot be installed together. Use --exclude to remove one.",
          );
          return;
        }
      }

      // Handle soft conflicts in interactive mode
      if (softConflicts.length > 0 && !options.yes) {
        Prompts.warning("Detected soft conflicts between modules:");
        for (const [mod1, mod2] of softConflicts) {
          console.log(`  • ${mod1} ↔ ${mod2}`);
        }
        console.log("\nThese modules have overlapping functionality.");

        const proceed = await Prompts.confirm(
          "Continue with all selected modules?",
          false,
        );
        if (!proceed) {
          return;
        }
      }

      // 5. Get context directory name
      const contextDirName = options.contextDir ||
        (options.yes ? "context" : await Prompts.requestContextDirName());

      // 6. Create lifecycle context
      const ctx = new DefaultLifecycleContext();

      // 7. Run lifecycle for each server
      const mcpConfig: Record<string, MCPServerEntry> = {};
      const installedServers: MCPServerModule[] = [];
      const allNeedsUserInput: Array<{
        moduleName: string;
        vars: Array<{ name: string; description: string; secret: boolean }>;
      }> = [];

      for (const server of selectedServers) {
        Prompts.info(`\nConfiguring ${server.metadata.name}...`);

        // Precheck
        if (!options.skipValidation) {
          Prompts.progress("Checking dependencies");
          const precheckResult = await server.precheck(ctx);

          if (!precheckResult.success) {
            Prompts.warning(`Dependency issues for ${server.metadata.name}:`);

            if (precheckResult.missing) {
              for (const missing of precheckResult.missing) {
                console.log(`  ❌ ${missing.message}`);
                if (missing.installCommand) {
                  console.log(`     Install: ${missing.installCommand}`);
                }
              }
            }

            if (options.yes) {
              Prompts.info(`Skipping ${server.metadata.name} (missing dependencies)`);
              continue;
            }

            const shouldContinue = await Prompts.confirm(
              `Continue with ${server.metadata.name} anyway?`,
              false,
            );

            if (!shouldContinue) {
              Prompts.info(`Skipping ${server.metadata.name}`);
              continue;
            }
          }
        }

        // Configure (collect secrets)
        Prompts.progress("Collecting configuration");
        const configResult = await server.configure(ctx);

        if (!configResult.success) {
          Prompts.error(
            `Configuration failed for ${server.metadata.name}: ${configResult.message}`,
          );
          continue;
        }

        // Save secrets if any
        if (configResult.secrets && Object.keys(configResult.secrets).length > 0) {
          await SecretsManager.initSecretsFile("project");
          for (const [key, value] of Object.entries(configResult.secrets)) {
            await SecretsManager.saveSecret(key, String(value), "project");
          }
        }

        // Install (generate MCP config)
        Prompts.progress("Generating configuration");
        const installResult = await server.install(ctx);

        if (!installResult.success) {
          Prompts.error(
            `Installation failed for ${server.metadata.name}: ${installResult.message}`,
          );
          continue;
        }

        if (installResult.mcpConfig) {
          // Get module for env vars and probing
          const module = await ServerRegistry.getModuleById(server.metadata.id);

          // Collect environment variables
          if (module?.metadata.env_vars && module.metadata.env_vars.length > 0) {
            const { secrets, nonSecrets, needsUserInput } = await collectEnvVars(
              server.metadata.name,
              module.metadata.env_vars,
              options.yes,
            );

            // Write env vars to files
            if (Object.keys(nonSecrets).length > 0) {
              await mergeEnvFile(join(Deno.cwd(), ".env.ftk"), nonSecrets);
            }
            if (Object.keys(secrets).length > 0) {
              await mergeEnvFile(join(Deno.cwd(), ".env.ftk.secrets"), secrets);
            }

            // Track vars that need user input
            if (needsUserInput.length > 0) {
              allNeedsUserInput.push({
                moduleName: server.metadata.name,
                vars: needsUserInput,
              });
            }
          }

          // Use ftk mcp proxy instead of direct command
          mcpConfig[server.metadata.id] = {
            command: "ftk",
            args: ["mcp", "proxy", server.metadata.id],
          };

          installedServers.push(server);
          Prompts.success(`${server.metadata.name} configured successfully`);

          // Probe and cache token counts for new modules
          if (module && module.metadata.probing?.enabled) {
            try {
              // Probe MCP server for exact token counts
              const probeResult = await probeMCPServer(
                module,
                installResult.mcpConfig.env,
              );

              if (probeResult.success && probeResult.tools) {
                // Calculate total token count from embedded instructions
                // Resolve polymorphic instructions for accurate token counting
                const selectedModuleIds = selectedServers.map((s) => s.metadata.id);
                let totalInstructionsTokens = 0;
                for (const { content } of module.instructions) {
                  const resolvedContent = typeof content === "function"
                    ? content({ installedModules: selectedModuleIds })
                    : content;
                  totalInstructionsTokens += estimateTokens(resolvedContent);
                }

                // Cache token counts and metadata
                await updateCachedTokens(
                  Deno.cwd(),
                  server.metadata.id,
                  probeResult.mcpTokens,
                  totalInstructionsTokens,
                  probeResult.tools,
                  module.metadata.installation.version,
                );

                // Copy all instruction files to cache
                // Pass selected module IDs for polymorphic instruction resolution
                await cacheInstructions(Deno.cwd(), module, selectedModuleIds);
              }
            } catch (error) {
              // Don't fail the whole installation if probing fails
              console.warn(
                `[init] Warning: Failed to probe ${server.metadata.id}:`,
                error instanceof Error ? error.message : String(error),
              );
            }
          }
        }
      }

      if (installedServers.length === 0) {
        Prompts.warning("No servers were successfully configured");
        return;
      }

      // 8. Save configurations
      Prompts.progress("Saving configurations");

      // Save .mcp.json
      await ConfigManager.saveMCPConfig({ mcpServers: mcpConfig });

      // Enable MCP servers in .claude/settings.json
      const serverIds = installedServers.map((s) => s.metadata.id);
      await ensureMcpServersEnabled(Deno.cwd(), serverIds);

      // Save .ftk/config.json with context directory
      const projectConfig = await ConfigManager.initProjectConfig(contextDirName);
      for (const server of installedServers) {
        projectConfig.servers[server.metadata.id] = {
          source: "project",
        };
      }
      await ConfigManager.saveProjectConfig(projectConfig);

      // 9. Create context directory (if needed)
      if (contextDirName) {
        Prompts.progress(`Creating ${contextDirName} directory`);
        await ContextDirManager.initContextDir(contextDirName);

        // Create server-specific context subdirectories
        for (const server of installedServers) {
          if (server.metadata.contextFolder || server.metadata.exposeContextToGit) {
            await ContextDirManager.createServerContextDir(
              server.metadata.id,
              server.metadata.contextFolder,
            );
          }
        }

        // Update .gitignore for context directory
        const exposedFolders = ContextDirManager.getExposedFolders(installedServers);
        await ContextDirManager.updateGitignore(contextDirName, exposedFolders);
      }

      // 10. Update CLAUDE.md
      Prompts.progress("Updating CLAUDE.md");

      const projectName = basename(Deno.cwd());
      await ClaudeMdManager.initialize(projectName);

      // Add each server's CLAUDE.md fragment with server-specific marker
      for (const server of installedServers) {
        const content = server.getClaudeMdContent();
        await ClaudeMdManager.upsertSection(
          `mcp:${server.metadata.id}`,
          content,
        );
      }

      // Ensure .gitignore
      const hasSecrets = installedServers.some(
        (s) => s.getSecrets && s.getSecrets().length > 0,
      );
      if (hasSecrets) {
        await SecretsManager.ensureGitignore();
      }

      // 11. Success!
      Prompts.success("Setup complete!");

      console.log("\n📋 Summary:");
      console.log(`  • Configured ${installedServers.length} MCP server(s):`);
      for (const server of installedServers) {
        console.log(`    - ${server.metadata.name}`);
      }
      console.log(`  • Created .mcp.json`);
      console.log(`  • Created .ftk/config.json`);

      if (contextDirName) {
        console.log(`  • Created ${contextDirName}/ directory`);
      }

      // Display post-install instructions for vars needing user input
      if (allNeedsUserInput.length > 0) {
        console.log("\n⚠️  Configuration Required\n");
        console.log("The following environment variables need to be configured:\n");

        for (const moduleInfo of allNeedsUserInput) {
          console.log(`${moduleInfo.moduleName}:`);
          for (const varInfo of moduleInfo.vars) {
            const fileLocation = varInfo.secret ? ".env.ftk.secrets" : ".env.ftk";
            const placeholder = `<your-${varInfo.name.toLowerCase().replace(/_/g, "-")}>`;
            console.log(`  • ${varInfo.name} (${varInfo.secret ? "secret" : "non-secret"})`);
            console.log(`    Description: ${varInfo.description}`);
            console.log(`    File: ${fileLocation}`);
            console.log(`    Replace: ${placeholder}\n`);
          }
        }

        console.log(
          "After updating these values, restart Claude Code to load the new configuration.",
        );
      }

      console.log(`  • Updated CLAUDE.md`);
      console.log(`  • Updated .gitignore`);

      if (hasSecrets) {
        console.log(`  • Created .env.mcp.secrets`);
      }

      console.log("\n🚀 Next steps:");
      console.log("  1. Review the generated files");
      console.log("  2. Run 'claude' to start Claude Code");
      console.log("  3. Claude Code will automatically load your MCP servers");

      console.log("\n🎓 Learn more at https://fluentwork.shop\n");
    } catch (error) {
      Prompts.error(
        `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}

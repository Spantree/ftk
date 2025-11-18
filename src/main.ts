#!/usr/bin/env -S deno run --allow-all

/**
 * Fluent Toolkit (ftk)
 * An opinionated toolkit for agentic engineers
 * From the Fluent Workshop - https://fluentwork.shop
 */

import { Command } from "@cliffy/command";
import { InitCommand } from "./commands/init.ts";
import { proxyCommand } from "./commands/mcp/proxy.ts";
import type { InitOptions } from "./types/index.ts";

const VERSION = "0.2.0";

await new Command()
  .name("ftk")
  .version(VERSION)
  .description(
    "Fluent Toolkit - An opinionated toolkit for agentic engineers\n" +
      "From the Fluent Workshop - https://fluentwork.shop",
  )
  .globalOption("-v, --verbose", "Enable verbose output")
  // Init command
  .command("init", "Initialize MCP servers for Claude Code in current project")
  .option("-f, --force", "Force re-initialization even if already configured")
  .option("--skip-validation", "Skip dependency validation checks")
  .option("--skip-checks", "Skip Claude Code installation and version checks")
  .option("-m, --modules <modules:string[]>", "Specify modules to install (comma-separated)")
  .option("--include <modules:string[]>", "Add modules to default set (comma-separated)")
  .option("--exclude <modules:string[]>", "Remove modules from default set (comma-separated)")
  .option("-c, --context-dir <dir:string>", "Context directory name (default: context)")
  .option(
    "-y, --yes",
    "Non-interactive mode: install defaults, write placeholders for required env vars",
  )
  .action(async (options) => {
    const initOptions: InitOptions = {
      force: options.force,
      skipValidation: options.skipValidation,
      skipChecks: options.skipChecks,
      modules: options.modules,
      include: options.include,
      exclude: options.exclude,
      contextDir: options.contextDir,
      yes: options.yes,
    };

    await InitCommand.execute(initOptions);
  })
  // Install command
  .command("install <module:string>", "Install an MCP module to current project")
  .option("-y, --yes", "Non-interactive mode: use defaults")
  .action(async (options, module: string) => {
    const { InstallCommand } = await import("./commands/install.ts");
    await InstallCommand.execute(module, { yes: options.yes });
  })
  // Remove command
  .command("remove <module:string>", "Remove an MCP module from current project")
  .action(async (_options, module: string) => {
    const { RemoveCommand } = await import("./commands/remove.ts");
    await RemoveCommand.execute(module);
  })
  // MCP command group
  .command("mcp", "MCP server management commands")
  .command("proxy <server-id:string>", "Proxy an MCP server with environment variable injection")
  .action(async (_options, serverId: string) => {
    await proxyCommand(serverId);
  })
  .reset() // Reset to root command before adding default action
  // Default action (show help)
  .action(function () {
    this.showHelp();
  })
  .parse(Deno.args);

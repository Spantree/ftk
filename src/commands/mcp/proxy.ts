/**
 * MCP proxy command - acts as transparent stdio proxy with env injection
 */

import { getModule } from "../../../modules/index.ts";
import { buildBaseEnv } from "../../../modules/types.ts";
import { getServerEnvVars } from "../../utils/env-files.ts";

/**
 * Proxy an MCP server with environment variable injection
 *
 * Usage: ftk mcp proxy <server-id>
 *
 * This command:
 * 1. Loads the module metadata
 * 2. Reads env vars from .env.ftk and .env.ftk.secrets
 * 3. Applies defaults from env_vars declarations
 * 4. Spawns the actual MCP server with env vars
 * 5. Acts as transparent stdio proxy
 */
export async function proxyCommand(serverId: string): Promise<void> {
  // Load module
  const module = await getModule(serverId);
  if (!module) {
    console.error(`Error: Module '${serverId}' not found`);
    Deno.exit(1);
  }

  // Get project directory (current directory)
  const projectDir = Deno.cwd();

  // Build base env from defaults
  const baseEnv = buildBaseEnv(module.metadata.env_vars);

  // Read env vars from files
  const fileEnv = await getServerEnvVars(projectDir, module.metadata.env_vars);

  // Merge: file env overrides base env
  const mergedEnv = { ...baseEnv, ...fileEnv };

  // Get MCP config
  const mcpConfig = module.metadata.mcp;
  if (!mcpConfig) {
    console.error(`Error: Module '${serverId}' does not provide an MCP server`);
    Deno.exit(1);
  }

  // Build final env (merge with process env, then our custom env)
  const finalEnv = {
    ...Deno.env.toObject(),
    ...mergedEnv,
  };

  // Spawn MCP server process
  const process = new Deno.Command(mcpConfig.command, {
    args: mcpConfig.args,
    env: finalEnv,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  // Run and wait for completion
  const { code } = await process.spawn().status;

  Deno.exit(code);
}

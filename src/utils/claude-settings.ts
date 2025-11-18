/**
 * Claude Code settings.json management
 * Handles enabling project MCP servers in .claude/settings.json
 */

import { join } from "@std/path";
import { ensureDir } from "@std/fs";

/**
 * Claude Code settings structure
 */
interface ClaudeSettings {
  $schema?: string;
  model?: string;
  enableAllProjectMcpServers?: boolean;
  enabledMcpjsonServers?: string[];
  disabledMcpjsonServers?: string[];
  [key: string]: unknown; // Allow other settings
}

/**
 * Ensure .claude/settings.json exists and enables the specified MCP servers
 *
 * Logic:
 * 1. If settings.json doesn't exist, create with enableAllProjectMcpServers: true
 * 2. If enabledMcpjsonServers exists (explicit allow list), add servers to it
 * 3. If no explicit list exists, set enableAllProjectMcpServers: true
 *
 * @param projectRoot - Project root directory
 * @param serverIds - MCP server IDs to enable
 */
export async function ensureMcpServersEnabled(
  projectRoot: string,
  serverIds: string[],
): Promise<void> {
  const claudeDir = join(projectRoot, ".claude");
  const settingsPath = join(claudeDir, "settings.json");

  // Ensure .claude directory exists
  await ensureDir(claudeDir);

  // Read existing settings or create new
  let settings: ClaudeSettings = {};
  try {
    const content = await Deno.readTextFile(settingsPath);
    settings = JSON.parse(content);
  } catch {
    // File doesn't exist, create new settings
    settings = {
      $schema: "https://json.schemastore.org/claude-code-settings.json",
    };
  }

  // Strategy 1: If explicit allow list exists, add servers to it
  if (Array.isArray(settings.enabledMcpjsonServers)) {
    const existingServers = new Set(settings.enabledMcpjsonServers);
    for (const serverId of serverIds) {
      existingServers.add(serverId);
    }
    settings.enabledMcpjsonServers = Array.from(existingServers).sort();
  } else {
    // Strategy 2: No explicit list, enable all project servers
    settings.enableAllProjectMcpServers = true;
  }

  // Write settings back
  await Deno.writeTextFile(
    settingsPath,
    JSON.stringify(settings, null, 2) + "\n",
  );
}

/**
 * Check if .claude/settings.json enables MCP servers
 *
 * @param projectRoot - Project root directory
 * @returns True if settings enable project MCP servers
 */
export async function areMcpServersEnabled(
  projectRoot: string,
): Promise<boolean> {
  const settingsPath = join(projectRoot, ".claude", "settings.json");

  try {
    const content = await Deno.readTextFile(settingsPath);
    const settings: ClaudeSettings = JSON.parse(content);

    // Check if enableAllProjectMcpServers is true
    if (settings.enableAllProjectMcpServers === true) {
      return true;
    }

    // Check if enabledMcpjsonServers has entries
    if (
      Array.isArray(settings.enabledMcpjsonServers) &&
      settings.enabledMcpjsonServers.length > 0
    ) {
      return true;
    }

    return false;
  } catch {
    // Settings don't exist
    return false;
  }
}

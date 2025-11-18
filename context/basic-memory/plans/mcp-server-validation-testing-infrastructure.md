---
title: MCP Server Validation Testing Infrastructure
type: note
permalink: plans/mcp-server-validation-testing-infrastructure
tags:
  - testing
  - mcp-servers
  - integration-tests
  - tart-vm
  - claude-code
  - validation
---

# MCP Server Validation Testing Infrastructure

## Overview

Create comprehensive integration tests to validate that each MCP server installed via `ftk init` works correctly end-to-end. Tests will run in Tart VM environment and verify:

1. Server selection and configuration
2. Directory structure creation
3. MCP server functionality via Claude Code

## Key Discovery: Claude Code Headless Mode

Claude Code supports non-interactive single-prompt execution via `--headless` flag:

```bash
claude --headless "your prompt here"
```

This enables automated testing of MCP server functionality without interactive sessions.

## Implementation Plan

### Phase 1: ftk init Non-Interactive Mode

**File**: `src/commands/init.ts`

Add CLI flags for automation:

- `--servers <list>` - Comma-separated server names (e.g., "basic-memory,sequential")
- `--context-dir <name>` - Context directory name (default: "context")
- `--skip-claude-checks` - Skip Claude Code installation validation
- `--yes` / `-y` - Auto-confirm all prompts

**Implementation**:

```typescript
interface InitOptions {
  servers?: string;
  contextDir?: string;
  skipClaudeChecks?: boolean;
  yes?: boolean;
}

async function runNonInteractive(options: InitOptions) {
  const selectedServers = options.servers?.split(",").map((s) => s.trim()) || [];
  const contextDirName = options.contextDir || "context";

  // Validate server names against registry
  for (const server of selectedServers) {
    if (!availableServers.find((s) => s.name === server)) {
      throw new Error(`Unknown server: ${server}`);
    }
  }

  // Skip Claude checks if requested (for testing)
  if (!options.skipClaudeChecks) {
    await performClaudeChecks(options);
  }

  // Generate configuration files
  await generateMcpConfig(selectedServers);
  await setupContextDirectory(contextDirName, selectedServers);
  await updateClaudeMd(selectedServers);
}
```

**Usage Example**:

```bash
# Interactive mode (existing behavior)
ftk init

# Non-interactive mode for testing
ftk init --servers=basic-memory --context-dir=context --skip-claude-checks --yes
```

### Phase 2: SSH Session Enhancements

**File**: `tests/integration/tart/ssh-session.ts`

Add file operation helper methods:

```typescript
export class SSHSession {
  // ... existing code ...

  /**
   * Check if file or directory exists on remote system
   */
  async fileExists(path: string): Promise<boolean> {
    const result = await this.sendCommand(`test -e ${path} && echo exists || echo notfound`);
    return result.output.trim() === "exists";
  }

  /**
   * Read file contents from remote system
   */
  async readFile(path: string): Promise<string> {
    const result = await this.sendCommand(`cat ${path}`);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to read file ${path}: ${result.stderr}`);
    }
    return result.output;
  }

  /**
   * Write file contents to remote system
   */
  async writeFile(path: string, content: string): Promise<void> {
    const escapedContent = content.replace(/'/g, "'\\''");
    await this.sendCommand(`echo '${escapedContent}' > ${path}`);
  }

  /**
   * Create directory on remote system
   */
  async mkdir(path: string): Promise<void> {
    await this.sendCommand(`mkdir -p ${path}`);
  }

  /**
   * Remove file or directory on remote system
   */
  async remove(path: string): Promise<void> {
    await this.sendCommand(`rm -rf ${path}`);
  }

  /**
   * List directory contents
   */
  async ls(path: string): Promise<string[]> {
    const result = await this.sendCommand(`ls -1 ${path}`);
    return result.output.trim().split("\n").filter((line) => line.length > 0);
  }
}
```

### Phase 3: Validation Helper Utilities

**File**: `tests/integration/scenarios/server-validation/validation-helpers.ts`

```typescript
import { SSHSession } from "../../tart/ssh-session.ts";
import { assertEquals, assertExists } from "@std/assert";

export interface FtkInitOptions {
  servers: string[];
  contextDir?: string;
  projectDir: string;
}

/**
 * Execute ftk init in non-interactive mode
 */
export async function runFtkInit(
  session: SSHSession,
  options: FtkInitOptions,
): Promise<void> {
  const { servers, contextDir = "context", projectDir } = options;

  // Create project directory
  await session.mkdir(projectDir);

  // Build ftk init command
  const serverList = servers.join(",");
  const cmd =
    `cd ${projectDir} && ftk init --servers=${serverList} --context-dir=${contextDir} --skip-claude-checks --yes`;

  const result = await session.sendCommand(cmd);

  if (result.exitCode !== 0) {
    throw new Error(`ftk init failed: ${result.stderr}`);
  }
}

/**
 * Validate .mcp.json configuration
 */
export async function validateMcpConfig(
  session: SSHSession,
  projectDir: string,
  expectedServers: string[],
): Promise<void> {
  const mcpConfigPath = `${projectDir}/.mcp.json`;

  // Verify file exists
  const exists = await session.fileExists(mcpConfigPath);
  assertEquals(exists, true, `.mcp.json not found at ${mcpConfigPath}`);

  // Read and parse config
  const content = await session.readFile(mcpConfigPath);
  const config = JSON.parse(content);

  // Verify structure
  assertExists(config.mcpServers, "mcpServers object missing");

  // Verify each expected server
  for (const server of expectedServers) {
    assertExists(
      config.mcpServers[server],
      `Server ${server} not found in .mcp.json`,
    );
  }
}

/**
 * Validate server directory structure
 */
export async function validateServerDirectory(
  session: SSHSession,
  projectDir: string,
  server: string,
  contextDir = "context",
): Promise<void> {
  const serverDir = `${projectDir}/${contextDir}/${server}`;
  const exists = await session.fileExists(serverDir);
  assertEquals(
    exists,
    true,
    `Expected directory not found: ${serverDir}`,
  );
}

/**
 * Validate CLAUDE.md was updated
 */
export async function validateClaudeMd(
  session: SSHSession,
  projectDir: string,
  expectedServers: string[],
): Promise<void> {
  const claudeMdPath = `${projectDir}/CLAUDE.md`;
  const exists = await session.fileExists(claudeMdPath);
  assertEquals(exists, true, "CLAUDE.md not found");

  const content = await session.readFile(claudeMdPath);

  // Verify server instructions are present
  for (const server of expectedServers) {
    const hasServerDocs = content.includes(server);
    assertEquals(
      hasServerDocs,
      true,
      `CLAUDE.md missing documentation for ${server}`,
    );
  }
}

/**
 * Execute Claude Code in headless mode
 */
export async function runClaudeHeadless(
  session: SSHSession,
  projectDir: string,
  prompt: string,
): Promise<string> {
  const cmd = `cd ${projectDir} && claude --headless "${prompt}"`;
  const result = await session.sendCommand(cmd, { timeout: 30000 });

  if (result.exitCode !== 0) {
    throw new Error(`Claude Code failed: ${result.stderr}`);
  }

  return result.output;
}
```

### Phase 4: Basic-Memory Validation Test

**File**: `tests/integration/scenarios/server-validation/basic-memory.test.ts`

```typescript
import { assertEquals } from "@std/assert";
import { SSHSession } from "../../tart/ssh-session.ts";
import {
  runClaudeHeadless,
  runFtkInit,
  validateClaudeMd,
  validateMcpConfig,
  validateServerDirectory,
} from "./validation-helpers.ts";

const TEST_VM_IP = Deno.env.get("TEST_VM_IP") || "192.168.64.x";
const TEST_PROJECT_DIR = "/tmp/ftk-test-basic-memory";

Deno.test("basic-memory MCP server validation", async (t) => {
  const session = new SSHSession(TEST_VM_IP, "admin");

  await t.step("setup - connect to VM", async () => {
    await session.connect();
  });

  await t.step("setup - clean previous test artifacts", async () => {
    await session.remove(TEST_PROJECT_DIR);
  });

  await t.step("run ftk init with basic-memory server", async () => {
    await runFtkInit(session, {
      servers: ["basic-memory"],
      contextDir: "context",
      projectDir: TEST_PROJECT_DIR,
    });
  });

  await t.step("verify .mcp.json configuration", async () => {
    await validateMcpConfig(session, TEST_PROJECT_DIR, ["basic-memory"]);
  });

  await t.step("verify context/basic-memory directory created", async () => {
    await validateServerDirectory(
      session,
      TEST_PROJECT_DIR,
      "basic-memory",
      "context",
    );
  });

  await t.step("verify CLAUDE.md updated", async () => {
    await validateClaudeMd(session, TEST_PROJECT_DIR, ["basic-memory"]);
  });

  await t.step("test Claude Code - write note via MCP", async () => {
    const prompt =
      "Use the basic-memory MCP server to create a new note titled 'Integration Test Note' with the content 'This note was created during automated testing to verify basic-memory MCP functionality.'";

    const output = await runClaudeHeadless(session, TEST_PROJECT_DIR, prompt);

    // Verify output indicates success
    const successIndicators = [
      "created",
      "note",
      "Integration Test Note",
    ];

    const hasSuccess = successIndicators.some((indicator) =>
      output.toLowerCase().includes(indicator.toLowerCase())
    );

    assertEquals(hasSuccess, true, "Claude output doesn't indicate note creation");
  });

  await t.step("test Claude Code - read note via MCP", async () => {
    const prompt =
      "Use the basic-memory MCP server to find and read the note titled 'Integration Test Note'. Show me its content.";

    const output = await runClaudeHeadless(session, TEST_PROJECT_DIR, prompt);

    // Verify the note content appears in output
    const hasNoteContent = output.includes("automated testing") &&
      output.includes("verify basic-memory MCP functionality");

    assertEquals(hasNoteContent, true, "Note content not found in Claude output");
  });

  await t.step("verify note file created in correct location", async () => {
    const noteDir = `${TEST_PROJECT_DIR}/context/basic-memory`;
    const files = await session.ls(noteDir);

    // Basic-memory creates note files - verify at least one exists
    const hasNoteFiles = files.length > 0;
    assertEquals(hasNoteFiles, true, "No note files found in basic-memory directory");
  });

  await t.step("cleanup - remove test artifacts", async () => {
    await session.remove(TEST_PROJECT_DIR);
  });

  await t.step("cleanup - disconnect from VM", async () => {
    await session.disconnect();
  });
});
```

### Phase 5: Documentation

**File**: `tests/integration/scenarios/server-validation/README.md`

````markdown
# MCP Server Validation Tests

Integration tests that validate MCP server installation and functionality.

## Overview

These tests verify that:

1. `ftk init` correctly configures MCP servers
2. Required directories and files are created
3. MCP servers are functional via Claude Code
4. End-to-end workflows work as expected

## Test Environment

- **Platform**: Tart VM (macOS virtualization)
- **Requirements**:
  - Tart installed and configured
  - Test VM running (use `just vm-setup`)
  - ftk binary installed in VM
  - Claude Code installed in VM

## Running Tests

```bash
# Setup VM
just vm-setup

# Run all server validation tests
deno test tests/integration/scenarios/server-validation/

# Run specific server test
deno test tests/integration/scenarios/server-validation/basic-memory.test.ts

# Set VM IP if needed
TEST_VM_IP=192.168.64.10 deno test tests/integration/scenarios/server-validation/
```
````

## Test Structure

Each server validation test follows this pattern:

1. **Setup**: Connect to VM, clean previous artifacts
2. **Init**: Run `ftk init --servers=<server> --yes`
3. **File Validation**: Verify `.mcp.json`, directories, `CLAUDE.md`
4. **Functionality Test**: Use Claude Code headless mode to test MCP operations
5. **Cleanup**: Remove test artifacts, disconnect

## Writing New Server Tests

To add validation for a new MCP server:

1. Copy `basic-memory.test.ts` as template
2. Update server name and test project directory
3. Modify Claude prompts for server-specific operations
4. Adjust validation logic for server's expected behavior
5. Update this README

## Claude Code Headless Mode

Tests use Claude Code's `--headless` flag for non-interactive execution:

```bash
claude --headless "your prompt here"
```

This allows automated testing of MCP server functionality.

## Validation Helpers

See `validation-helpers.ts` for reusable test utilities:

- `runFtkInit()` - Execute ftk init non-interactively
- `validateMcpConfig()` - Verify .mcp.json structure
- `validateServerDirectory()` - Check directory creation
- `validateClaudeMd()` - Verify CLAUDE.md updates
- `runClaudeHeadless()` - Execute Claude Code prompts

## Troubleshooting

**VM Connection Issues**:

- Verify VM is running: `just vm-list`
- Check IP address: `tart ip <vm-name>`
- Test SSH: `just vm-ssh`

**ftk Command Not Found**:

- Install ftk in VM: `just vm-install-ftk`

**Claude Code Not Installed**:

- Install in VM: `npm install -g @anthropic-ai/claude-code`

**Test Timeout**:

- Increase timeout in `runClaudeHeadless()` call
- Claude prompts may take 10-30s depending on complexity

````
## Justfile Additions

Add commands to `Justfile` for running server validation tests:

```justfile
# Run server validation tests
test-server-validation:
    deno test tests/integration/scenarios/server-validation/

# Run specific server validation test
test-server SERVER:
    deno test tests/integration/scenarios/server-validation/{{SERVER}}.test.ts

# Setup VM with all prerequisites for testing
vm-test-setup VM_NAME="FTK-test":
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Setting up VM for server validation tests..."
    just vm-start {{VM_NAME}}
    just vm-install-ftk
    tart run {{VM_NAME}} -- npm install -g @anthropic-ai/claude-code
    echo "VM ready for testing!"
````

## Success Criteria

For each MCP server, validation passes when:

1. ✅ `ftk init` completes without errors
2. ✅ `.mcp.json` contains correct server configuration
3. ✅ `context/<server>` directory exists
4. ✅ `CLAUDE.md` includes server documentation
5. ✅ Claude Code can execute MCP operations (write/read)
6. ✅ MCP server creates expected files/data
7. ✅ All test steps complete within timeout limits

## Future Enhancements

- Test error scenarios (missing dependencies, invalid config)
- Test server-specific advanced features
- Performance benchmarking
- Parallel test execution
- CI/CD integration with automated VM provisioning
- Test other MCP servers (Sequential Thinking, Context7, etc.)

---
title: "#018: Add MCP Environment and Args Management"
type: plan
tags:
  - secrets
  - security
  - mcp
  - cli
  - enhancement
  - environment-variables
  - proxy
permalink: plans/018-add-mcp-environment-and-args-management
---

# Add MCP Environment and Args Management

**Status**: 📌 BACKLOG

**Issue**: https://github.com/Spantree/ftk/issues/18

## Problem Statement

**Current Limitation**: FTK currently uses `npx dotenv-cli` to provide environment variables to MCP servers, which exposes ALL variables to ALL servers. This violates the principle of least privilege.

**Example** (current .mcp.json):

```json
"github": {
  "command": "npx",
  "args": ["-y", "dotenv-cli", "-e", ".env.ftk.secrets", "--",
           "npx", "-y", "@modelcontextprotocol/server-github"]
}
```

**Security Issue**: The GitHub MCP server can access:

- `GITHUB_PERSONAL_ACCESS_TOKEN` ✓ (needs this)
- `EXA_API_KEY` ✗ (shouldn't see this)
- `FIRECRAWL_API_KEY` ✗ (shouldn't see this)
- `ANTHROPIC_API_KEY` ✗ (shouldn't see this)

## Proposed Solution

Create `ftk mcp` subcommand suite for managing MCP server execution:

**Commands**:

```bash
# Output all env vars to stdout (secrets + config, merged)
ftk mcp env <server-id>

# Output ONLY config to stdout (exclude secrets)
ftk mcp env <server-id> --exclude-secrets

# Output ONLY secrets to stdout (from .env.ftk.secrets)
ftk mcp secrets <server-id>

# Output args to stdout (for scripting)
ftk mcp args <server-id>

# Run server with scoped env + args (unified proxy)
ftk mcp proxy <server-id>
```

**Primary Usage** (via proxy):

```bash
ftk mcp proxy github
```

**Updated .mcp.json**:

```json
"github": {
  "command": "ftk",
  "args": ["mcp", "proxy", "github"]
}
```

**How it works**: The proxy reads server metadata, injects scoped environment variables (if declared), passes CLI args (if declared), and executes the server command.

**Future**: Tool filtering will be added to `ftk mcp proxy` in issue #17.

## Design Decisions

### Unified Proxy Command

`ftk mcp proxy` is the primary interface, handling both environment variables and CLI args. Individual commands (`ftk mcp env`, `ftk mcp args`) are available for debugging/scripting but the proxy is what gets used in `.mcp.json`.

**Benefits**:

- Single command in .mcp.json (cleaner config)
- Consistent execution pattern across all MCP servers
- Easy to extend with future features (tool filtering, rate limiting, etc.)
- Server metadata is single source of truth

### Whitelist-Based Filtering (Not Prefix-Based)

Instead of using prefixes and pattern matching, each server module explicitly declares which environment variables it needs:

**Server Registry Metadata**:

```typescript
// registry/mcp-servers/github/index.ts
export default {
  id: "github",
  name: "GitHub",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: {
    required: ["GITHUB_PERSONAL_ACCESS_TOKEN"],
    optional: ["GITHUB_API_URL", "GITHUB_TIMEOUT"],
  },
  // Optional: For servers that prefer CLI args over env vars
  // serverArgs: {
  //   required: ["--token"],
  //   optional: ["--api-url"]
  // }
};
```

**Why Whitelist Approach?**

1. **Explicit > Implicit**: Server declares exactly what it needs
2. **No transformation**: Use actual variable names as MCPs expect them
3. **Validation**: Can verify required variables are present
4. **Safer**: No accidental exposure via prefix collisions
5. **Better errors**: "GITHUB_PERSONAL_ACCESS_TOKEN is required" vs "no GITHUB_\* variables found"

### Environment Variable Naming

**Use actual variable names** - exactly as MCP servers expect them:

```bash
# .env.ftk.secrets (gitignored)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx
EXA_API_KEY=xxx
FIRECRAWL_API_KEY=fc_xxx

# .env.ftk (checked into git)
GITHUB_API_URL=https://api.github.com
```

**No prefixing or transformation needed** - variables are used as-is.

### Architecture: Pluggable Environment Providers

**Provider Interface**:

```typescript
// src/core/env/provider.ts
interface EnvProvider {
  name: string;
  load(): Promise<Record<string, string>>;
  isAvailable(): Promise<boolean>;
}
```

**Initial Implementation**: File-based provider (`.env.ftk` + `.env.ftk.secrets`)
**Future Providers**: macOS Keychain, 1Password CLI, HashiCorp Vault, etc.

## Implementation Plan

### 📌 Phase 1: Core Infrastructure

#### ⏳ Task 1.1: Create Environment Provider Abstraction

- [ ] Create `src/core/env/provider.ts` with `EnvProvider` interface
- [ ] Define provider contract (name, load, isAvailable methods)
- [ ] Add provider selection logic

**Files**:

- `src/core/env/provider.ts` (new)

#### ⏳ Task 1.2: Implement File-based Provider

- [ ] Create `src/core/env/file-provider.ts`
- [ ] Implement .env file parsing (handle comments, KEY=value format)
- [ ] Support loading from both `.env.ftk.secrets` and `.env.ftk`
- [ ] Merge values with secrets taking precedence over non-secrets
- [ ] Handle edge cases (missing files, malformed entries, etc.)

**Files**:

- `src/core/env/file-provider.ts` (new)

**Key Logic**:

```typescript
class FileEnvProvider implements EnvProvider {
  async load(): Promise<Record<string, string>> {
    // Load both files
    const config = await loadEnvFile(".env.ftk");
    const secrets = await loadEnvFile(".env.ftk.secrets");

    // Merge with secrets taking precedence
    return { ...config, ...secrets };
  }
}

async function loadEnvFile(path: string): Promise<Record<string, string>> {
  try {
    const content = await Deno.readTextFile(path);
    return parseEnvContent(content);
  } catch {
    return {}; // File not found is OK
  }
}
```

#### ⏳ Task 1.3: Add Environment Metadata to Server Registry

- [ ] Update server registry TypeScript interface to include `env` field
- [ ] Update existing server modules (github, exa, firecrawl, etc.) with env declarations
- [ ] Document required vs optional environment variables

**Files**:

- `src/core/registry.ts` (modify interface)
- `registry/mcp-servers/*/index.ts` (modify all servers)

**Example Server Update**:

```typescript
// registry/mcp-servers/github/index.ts
export default {
  id: "github",
  name: "GitHub",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: {
    required: ["GITHUB_PERSONAL_ACCESS_TOKEN"],
    optional: ["GITHUB_API_URL"],
  },
};
```

#### ⏳ Task 1.4: Create `ftk mcp` Commands

- [ ] Create `src/commands/mcp/env.ts` - Output env vars (secrets + config) to stdout
- [ ] Create `src/commands/mcp/secrets.ts` - Output ONLY secrets to stdout
- [ ] Create `src/commands/mcp/args.ts` - Output args to stdout
- [ ] Create `src/commands/mcp/proxy.ts` - Unified server execution
- [ ] Parse command arguments (server-id, options)
- [ ] Load server metadata from registry
- [ ] For `env`: Load both files, merge, filter by server, output as KEY=VALUE
- [ ] For `env --exclude-secrets`: Load ONLY .env.ftk, filter by server, output as KEY=VALUE
- [ ] For `secrets`: Load ONLY .env.ftk.secrets, filter by server, output as KEY=VALUE
- [ ] For `args`: Output space-separated args for server
- [ ] For `proxy`: Execute server with scoped env + args
- [ ] Validate required variables/args are present
- [ ] Handle command exit codes properly

**Files**:

- `src/commands/mcp/env.ts` (new)
- `src/commands/mcp/secrets.ts` (new)
- `src/commands/mcp/args.ts` (new)
- `src/commands/mcp/proxy.ts` (new)
- `src/commands/mcp/index.ts` (new - subcommand router)
- `src/main.ts` (modify - add mcp command registration)

**Proxy Command Flow**:

```typescript
// src/commands/mcp/proxy.ts
export async function proxyCommand(
  serverId: string,
  options: { provider?: string },
) {
  // 1. Look up server in registry
  const server = await getServerMetadata(serverId);
  if (!server) {
    throw new Error(`Unknown server: ${serverId}`);
  }

  // 2. Load and filter environment variables
  const provider = new FileEnvProvider();
  const allEnv = await provider.load();

  const declaredVars = [
    ...(server.env?.required || []),
    ...(server.env?.optional || []),
  ];
  const filteredEnv = Object.fromEntries(
    Object.entries(allEnv).filter(([key]) => declaredVars.includes(key)),
  );

  // 3. Validate required env vars
  for (const required of server.env?.required || []) {
    if (!(required in filteredEnv)) {
      throw new Error(`Missing required environment variable: ${required}`);
    }
  }

  // 4. Build server args (if declared)
  const serverArgs = buildServerArgs(server, filteredEnv);

  // 5. Execute server with scoped env + args
  const cmd = new Deno.Command(server.command, {
    args: [...server.args, ...serverArgs],
    env: { ...Deno.env.toObject(), ...filteredEnv },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await cmd.output();
  Deno.exit(code);
}

function buildServerArgs(
  server: ServerMetadata,
  env: Record<string, string>,
): string[] {
  // Build args from serverArgs metadata
  // Example: { required: ["--token"] } + env.GITHUB_PERSONAL_ACCESS_TOKEN
  //       => ["--token", "ghp_xxx"]
  const args: string[] = [];
  // Implementation details...
  return args;
}
```

### 📌 Phase 2: Migration Support

#### ⏳ Task 2.1: Add `ftk mcp migrate` Command

- [ ] Parse existing `.env.mcp.secrets` file
- [ ] Rename to `.env.ftk.secrets`
- [ ] Create backup (`.env.mcp.secrets.bak`)
- [ ] Update `.gitignore` if needed
- [ ] Show migration summary

**Files**:

- `src/commands/mcp/migrate.ts` (new)

**Migration Flow**:

```bash
ftk mcp migrate

✓ Backed up .env.mcp.secrets → .env.mcp.secrets.bak
✓ Renamed .env.mcp.secrets → .env.ftk.secrets
✓ Updated .gitignore

Migrated 4 environment variables:
  - GITHUB_PERSONAL_ACCESS_TOKEN
  - EXA_API_KEY
  - FIRECRAWL_API_KEY
  - ANTHROPIC_API_KEY
```

#### ⏳ Task 2.2: Update .mcp.json Migration

- [ ] Detect existing `dotenv-cli` usage in .mcp.json
- [ ] Offer to update to `ftk mcp proxy` automatically
- [ ] Update command/args for each affected server
- [ ] Preserve other configuration (version, type, etc.)

### 📌 Phase 3: Integration with `ftk init`

#### ⏳ Task 3.1: Update MCP Config Generation

- [ ] Modify server installation to use `ftk mcp proxy` wrapper when server declares env vars or args
- [ ] Update .mcp.json generation logic in `src/commands/init.ts`
- [ ] Handle servers with no env/args (use direct command, no proxy)
- [ ] Prompt for required env vars during configuration

**Generated Config Example**:

```json
"github": {
  "command": "ftk",
  "args": ["mcp", "proxy", "github"],
  "version": "^2025.4.8"
}
```

#### ⏳ Task 3.2: Update Interactive Configuration

- [ ] During `ftk init`, prompt for required env vars
- [ ] Write secrets to `.env.ftk.secrets`
- [ ] Write non-secrets to `.env.ftk` (if any)
- [ ] Add `.env.ftk.secrets` to `.gitignore` if not present
- [ ] Show clear instructions about which file contains what

**Configuration Prompts**:

```
⚙️  Configuring GitHub MCP Server

Required environment variables:
  GITHUB_PERSONAL_ACCESS_TOKEN: Enter your GitHub personal access token
  > ghp_***

✓ Saved to .env.ftk.secrets (gitignored)
```

### 📌 Phase 4: Testing

#### ⏳ Task 4.1: Unit Tests

- [ ] Test .env file parsing (comments, blank lines, quotes, multi-line)
- [ ] Test variable filtering logic
- [ ] Test required variable validation
- [ ] Test edge cases (missing files, empty values, malformed env)
- [ ] Test migration logic

**Test Cases**:

```typescript
// Filtering
const server = {
  env: {
    required: ["GITHUB_PERSONAL_ACCESS_TOKEN"],
    optional: ["GITHUB_API_URL"],
  },
};
const allEnv = {
  GITHUB_PERSONAL_ACCESS_TOKEN: "xxx",
  EXA_API_KEY: "yyy",
  GITHUB_API_URL: "https://api.github.com",
};
const filtered = filterEnv(server, allEnv);
assertEquals(filtered, {
  GITHUB_PERSONAL_ACCESS_TOKEN: "xxx",
  GITHUB_API_URL: "https://api.github.com",
});

// Validation
assertThrows(() => {
  validateRequired(server, { EXA_API_KEY: "yyy" });
}, "Missing required environment variable: GITHUB_PERSONAL_ACCESS_TOKEN");
```

#### ⏳ Task 4.2: Integration Tests

- [ ] Verify env var scoping actually works (server can't see undeclared vars)
- [ ] Test command execution with injected environment
- [ ] Test provider fallback logic
- [ ] Test with real MCP servers (if possible in CI)

**Security Test**:

```bash
# Verify GitHub MCP only sees declared variables
# Create test server that prints all env vars
ftk env github -- deno eval 'console.log(Object.keys(Deno.env.toObject()))'
# Should NOT include EXA_API_KEY or FIRECRAWL_API_KEY
```

#### ⏳ Task 4.3: VM Integration Tests

- [ ] Add test case to Tart VM test suite
- [ ] Test `ftk init` with new env var prompting
- [ ] Test migration from dotenv-cli to ftk env
- [ ] Verify MCP servers work with scoped environment

### 📌 Phase 5: Documentation

#### ⏳ Task 5.1: Update Project Documentation

- [ ] Document whitelist approach in CLAUDE.md
- [ ] Add examples to README
- [ ] Create migration guide for existing users
- [ ] Update server registry documentation
- [ ] Update `.gitignore` to include `.env.ftk.secrets`

**CLAUDE.md Addition**:

````markdown
## Environment Variable Management

FTK uses scoped environment variables with explicit whitelisting:

**Files**:

- `.env.ftk.secrets` - Gitignored secrets (API keys, tokens)
- `.env.ftk` - Non-secret config (checked into git)

**Example**:

```bash
# .env.ftk.secrets (gitignored)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx
EXA_API_KEY=xxx

# .env.ftk (in git)
GITHUB_API_URL=https://api.github.com
```
````

**How It Works**:

Each MCP server declares which environment variables it needs. When `ftk env` runs, it only passes declared variables to that server, ensuring isolation.

**Usage**: Automatically handled by `ftk init`

````
#### ⏳ Task 5.2: Update Server-Specific Documentation

- [ ] Update each server's `claude.md` with env var requirements
- [ ] Document required vs optional variables
- [ ] Add examples showing .env.ftk format

#### ⏳ Task 5.3: Create User Guide

- [ ] Write `docs/environment-variables.md`
- [ ] Document provider system
- [ ] Add troubleshooting section (missing vars, file locations, etc.)
- [ ] Include migration instructions from dotenv-cli

### 📌 Phase 6: Future Enhancements (Backlog)

#### Future Task: macOS Keychain Provider

- [ ] Implement `KeychainEnvProvider`
- [ ] Use `security find-generic-password` command
- [ ] Add keychain storage via `ftk env set`

#### Future Task: 1Password CLI Provider

- [ ] Implement `OnePasswordEnvProvider`
- [ ] Use `op` CLI for secret retrieval
- [ ] Add `ftk env set --provider=1password`

#### Future Task: Shared Variables Support

- [ ] Add `shared: []` array to server metadata
- [ ] Allow certain vars to be available to multiple servers
- [ ] Document shared vs scoped variables

#### Future Task: Provider Configuration

- [ ] Add `.ftk/config.json` for provider preferences
- [ ] Allow per-server provider override
- [ ] Support provider priority/fallback chain

## Technical Specifications

### File Locations

- Environment provider interface: `src/core/env/provider.ts`
- File provider: `src/core/env/file-provider.ts`
- Env command: `src/commands/env.ts`
- Secrets file: `.env.ftk.secrets` (project root, gitignored)
- Config file: `.env.ftk` (project root, checked into git)

### Command Syntax

```bash
# Output all env vars (secrets + config, filtered by server)
ftk mcp env <server-id>

# Output ONLY config (exclude secrets, filtered by server)
ftk mcp env <server-id> --exclude-secrets

# Output ONLY secrets (from .env.ftk.secrets, filtered by server)
ftk mcp secrets <server-id>

# Output args for server
ftk mcp args <server-id>

# Run server with scoped env + args (primary usage)
ftk mcp proxy <server-id>

# Migrate from dotenv-cli format
ftk mcp migrate

# Future: Set environment variable via provider
ftk mcp set <server-id> <var-name> [--provider=<name>]
```

### Environment Variable Format

```bash
# Use actual variable names - no transformation needed
# .env.ftk.secrets (gitignored - secrets only)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx
EXA_API_KEY=xxx

# .env.ftk (checked into git - non-secret config)
GITHUB_API_URL=https://api.github.com
```

### Server Metadata Format

```typescript
{
  id: "server-name",
  name: "Display Name",
  env: {
    required: ["VAR1", "VAR2"],  // Must be present
    optional: ["VAR3", "VAR4"]   // Nice to have
  }
}
```

### Provider Selection Strategy

1. Check for explicit `--provider` flag
2. Check `.ftk/config.json` for preference
3. Use first available provider
4. Default order: file → keychain → 1password

## Success Criteria

- [ ] `ftk mcp proxy` command successfully runs servers with scoped env + args
- [ ] `ftk mcp env` outputs filtered env vars (secrets + config merged)
- [ ] `ftk mcp secrets` outputs ONLY secrets (from .env.ftk.secrets)
- [ ] `ftk mcp args` outputs args for servers that need them
- [ ] Loads from both `.env.ftk` and `.env.ftk.secrets` with proper precedence
- [ ] Validates required variables are present with helpful error messages
- [ ] Whitelist-based filtering implemented (not prefix-based)
- [ ] Migration from `dotenv-cli` to `ftk mcp proxy` works seamlessly
- [ ] `ftk init` generates configs using `ftk mcp proxy` and prompts for required vars
- [ ] All server modules updated with env declarations (and serverArgs where needed)
- [ ] Unit tests verify filtering and validation work correctly
- [ ] Integration tests verify MCP servers receive only declared variables
- [ ] `.gitignore` updated to include `.env.ftk.secrets` but not `.env.ftk`
- [ ] Documentation updated with examples and migration guide
- [ ] Backward compatibility maintained (old installs continue working)
- [ ] Foundation for future tool filtering (issue #17)

## Security Benefits

**Before**: All MCP servers see all environment variables

- GitHub MCP: sees GITHUB, EXA, FIRECRAWL, ANTHROPIC tokens
- EXA MCP: sees GITHUB, EXA, FIRECRAWL, ANTHROPIC tokens

**After**: Each MCP server sees only declared variables

- GitHub MCP: sees only `GITHUB_PERSONAL_ACCESS_TOKEN` (declared in metadata)
- EXA MCP: sees only `EXA_API_KEY` (declared in metadata)

**Principle**: Least privilege - minimize blast radius of compromised MCP servers

## Related Issues

- **Issue #17**: MCP Tool Filtering Proxy - Will extend `ftk mcp proxy` with tool filtering
- Related to environment variable management and security
- Part of broader security hardening effort
- `ftk mcp proxy` provides foundation for future MCP enhancements

## Observations

- **Unified proxy pattern**: `ftk mcp proxy` provides clean abstraction for MCP server execution
- **Extensible design**: Easy to add tool filtering (issue #17), rate limiting, logging, etc.
- **Whitelist approach**: More explicit and safer than prefix-based filtering
- **No transformation**: Using actual variable names avoids complexity
- **Server metadata**: Single source of truth for env requirements, args, and future features
- **Validation**: Catches configuration errors early with helpful messages
- **File-based provider**: Simplest starting point, sufficient for most users
- **Enterprise ready**: Architecture supports Vault, AWS Secrets Manager, etc. in future
- **Dual file support**: Separates secrets (.env.ftk.secrets) from config (.env.ftk)
- **Args support**: Handles servers that prefer CLI args over env vars

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [Principle of Least Privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege)
- [dotenv-cli](https://github.com/entropitor/dotenv-cli) - Current approach being replaced
- [Twelve-Factor App - Config](https://12factor.net/config) - Environment variable best practices
````

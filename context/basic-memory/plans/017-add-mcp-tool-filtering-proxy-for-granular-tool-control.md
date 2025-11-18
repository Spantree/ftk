---
title: "#017: Add MCP Tool Filtering Proxy for Granular Tool Control"
type: plan
url: https://github.com/myorg/ftk/issues/17
permalink: plans/017-add-mcp-tool-filtering-proxy-for-granular-tool-control
tags:
  - issue-017
  - mcp
  - tool-filtering
  - proxy
  - enhancement
---

# #017: Add MCP Tool Filtering Proxy for Granular Tool Control

**Status**: 📌 BACKLOG

## Problem Statement

**Claude Code Limitation**: Claude Code currently only supports server-level controls for MCP servers - you can enable/disable entire servers but cannot selectively filter individual tools within a server.

**User Impact**:

- Comprehensive MCP servers (filesystem, GitHub, Exa, Atlassian) expose dozens to hundreds of tools
- Unwanted tools consume 50k+ tokens of context window
- Significantly decreases quality due to context pollution
- Claude Code GitHub issue #7328 has 103 upvotes requesting this feature (still open, no official response)

**Example Use Case**: User wants only Exa's deep research tools (`deep_researcher_start`, `deep_researcher_check`) but not web search tools (`web_search_exa`, `company_research_exa`, etc.)

## Solution Overview

Build a lightweight MCP tool filtering proxy directly into ftk using TypeScript/Deno.

### Architecture

```
Claude Code
    ↕ (stdio JSON-RPC)
ftk MCP Filter Proxy (.ftk/bin/mcp-filter-proxy.ts)
    ↕ (stdio JSON-RPC)
Real MCP Server (npx @exa/mcp-server)
```

### Key Design Points

1. **Leverage Existing Code**: `src/core/mcp-probe.ts` already implements 80% of required functionality
2. **Simple Proxy Logic**: Intercept `tools/list` response, filter based on whitelist/blacklist
3. **Transparent Integration**: Configured via `module.yaml`, auto-generated in `.mcp.json`

## Implementation Plan

### Phase 1: Core Proxy Implementation

**File**: `src/core/mcp-filter-proxy.ts`

📌 **BACKLOG**

- Create bidirectional JSON-RPC forwarding (spawn server, pipe stdin/stdout)
- Add `tools/list` response filtering logic
- Handle errors and timeouts
- Support both whitelist and blacklist modes
- Add `--verbose` flag for debugging
- Unit tests

**Estimate**: 4-6 hours

### Phase 2: Type System & Module Schema

**Files**: `modules/types.ts`, `src/core/module-loader.ts`

📌 **BACKLOG**

- Add `tool_filtering` to `MCPConfig` interface
- Update YAML schema parser
- Add validation for whitelist/blacklist
- Type definitions for proxy CLI args

**Estimate**: 1-2 hours

### Phase 3: ftk Integration

**Files**: `src/commands/init.ts`, `src/core/mcp-config.ts`

📌 **BACKLOG**

- Detect when module has `tool_filtering.supported: true`
- Generate proxy wrapper command in `.mcp.json`
- Pass whitelist/blacklist as CLI args
- Handle both filtered and non-filtered servers in same config

**Estimate**: 2-3 hours

### Phase 4: Testing & Documentation

📌 **BACKLOG**

- Update Sequential module to test no-filter case
- Create test module with filtering enabled
- Test with Exa (real-world use case)
- Document `tool_filtering` in module.yaml format
- Add examples to README
- Performance benchmarks

**Estimate**: 2-3 hours

## Technical Implementation Details

### Module Configuration Example

```yaml
id: exa
name: Exa AI Search
mcp:
  command: npx
  args: ["-y", "@exa/mcp-server"]
  tool_filtering:
    supported: true
    whitelist:
      - deep_researcher_start
      - deep_researcher_check
```

### Generated .mcp.json

```json
{
  "mcpServers": {
    "exa": {
      "command": "deno",
      "args": [
        "run",
        "--allow-all",
        ".ftk/bin/mcp-filter-proxy.ts",
        "--whitelist",
        "deep_researcher_start,deep_researcher_check",
        "--",
        "npx",
        "-y",
        "@exa/mcp-server"
      ],
      "env": { "EXA_API_KEY": "${EXA_API_KEY}" }
    }
  }
}
```

### Proxy CLI Interface

```bash
# Whitelist mode
deno run --allow-all .ftk/bin/mcp-filter-proxy.ts \
  --whitelist tool1,tool2,tool3 \
  -- npx @server/package

# Blacklist mode
deno run --allow-all .ftk/bin/mcp-filter-proxy.ts \
  --blacklist dangerous_tool,unwanted_tool \
  -- npx @server/package

# Verbose logging
deno run --allow-all .ftk/bin/mcp-filter-proxy.ts \
  --verbose \
  --whitelist tool1,tool2 \
  -- npx @server/package
```

### Core Filtering Logic

```typescript
// Intercept tools/list response
if (request.method === "tools/list" && response.result?.tools) {
  const tools = response.result.tools;

  // Apply whitelist (if specified)
  if (whitelist && whitelist.length > 0) {
    response.result.tools = tools.filter((t) => whitelist.includes(t.name));
  }

  // Apply blacklist (if specified)
  if (blacklist && blacklist.length > 0) {
    response.result.tools = tools.filter((t) => !blacklist.includes(t.name));
  }
}
```

## Success Criteria

- [ ] Users can specify `tool_filtering` in `module.yaml`
- [ ] ftk init generates correct proxy wrapper in `.mcp.json`
- [ ] Filtered tools don't appear in Claude Code
- [ ] All other MCP functionality works unchanged
- [ ] No performance degradation
- [ ] Works with all MCP servers (not just Exa)
- [ ] Comprehensive test coverage
- [ ] Documentation complete

## Total Effort Estimate

**9-14 hours** (~1-2 days)

## Observations

- This addresses a critical gap that has strong community demand (103 upvotes)
- Low implementation cost with high user value
- Gives ftk competitive advantage over manual MCP setup
- Can be shipped independently of other features
- Existing `mcp-probe.ts` code significantly reduces implementation time

## Related

- Claude Code issue: anthropics/claude-code#7328
- Existing implementation: `src/core/mcp-probe.ts`
- Module system: `modules/types.ts`, `modules/sequential/module.yaml`

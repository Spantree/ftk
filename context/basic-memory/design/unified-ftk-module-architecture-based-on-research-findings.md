---
title: Unified FTK Module Architecture Based on Research Findings
type: note
permalink: design/unified-ftk-module-architecture-based-on-research-findings
tags:
  - architecture
  - modules
  - unified-design
  - research-synthesis
  - ftk
---

# Unified FTK Module Architecture Based on Research Findings

## Executive Summary

After researching 9 MCP servers and authentication patterns, we can now design a unified ftk module system that handles the full spectrum from zero-config (Sequential Thinking) to complex orchestration (EXA Researcher with Basic Memory integration).

## Key Research Insights

### Authentication Spectrum (Simplest → Most Complex)

1. **No Auth** (Sequential Thinking)
   - Zero configuration
   - YAML-only module definition

2. **Simple API Keys** (Context7, RefTools, EXA, Tavily, FireCrawl)
   - Optional (Context7) or required (others)
   - Stored in `.env.mcp.secrets` with 600 permissions
   - Single prompt: "Enter API key"

3. **CLI-Assisted Tokens** (GitHub)
   - Prefer `gh auth token` automation
   - Fallback to manual token creation guide
   - **CRITICAL**: Package deprecated, must migrate before Nov 19, 2025

4. **OAuth + Local Server** (Notion)
   - Authorization code flow
   - Local HTTP server on ephemeral port
   - SSE for token delivery
   - 30-day token expiry with refresh logic

5. **Git-Based + Configuration** (Serena)
   - Install via `uvx --from git+https://github.com/oraios/serena`
   - Requires `project.yml` setup
   - Multiple `--project` args, context selection

### Installation Methods Matrix

| Module       | Method      | Package Name                                       | Registry     |
| ------------ | ----------- | -------------------------------------------------- | ------------ |
| Sequential   | npm         | `@modelcontextprotocol/server-sequential-thinking` | npm          |
| Context7     | npm         | `@upstash/context7-mcp`                            | npm          |
| RefTools     | npm OR HTTP | `ref-tools-mcp` OR remote                          | npm / remote |
| FireCrawl    | npm         | `firecrawl-mcp`                                    | npm          |
| Notion       | npm         | `@notionhq/notion-mcp-server`                      | npm          |
| GitHub       | npm         | `@modelcontextprotocol/server-github` (deprecated) | npm          |
| Basic Memory | PyPI        | `basic-memory`                                     | PyPI         |
| EXA          | npm         | `exa-mcp-server`                                   | npm          |
| Tavily       | npm OR HTTP | `@tavily/mcp` OR remote                            | npm / remote |
| Serena       | Git+UVX     | `git+https://github.com/oraios/serena`             | Git          |

### Mutual Exclusivity - Validated

**Hard Conflicts (code-context-providers):**

- Context7 ⚔️ RefTools
  - Both provide code documentation
  - MCP clients can only bind one server per alias
  - Must choose one

**Soft Preferences (ai-search-providers):**

- EXA 🔄 Tavily
  - EXA: Semantic research, deep analysis, 3 models (fast/standard/pro)
  - Tavily: Real-time search, 93.3% accuracy, 92% lower latency
  - Most users choose one, but not technically incompatible

### Pricing & Rate Limits - Key Findings

| Service    | Free Tier          | Rate Limit (Free) | Paid Starting       |
| ---------- | ------------------ | ----------------- | ------------------- |
| Context7   | ✓ Public repos     | 60 req/hour       | $7/seat/mo          |
| RefTools   | ✓ 1,000 credits/mo | 10 req/sec        | $9/mo (5K credits)  |
| EXA        | ✓ 50 searches/day  | 60 req/min        | Pay-as-you-go       |
| Tavily     | ✓ 1,000 credits/mo | 100 req/min (dev) | $30/mo (4K credits) |
| FireCrawl  | ✓                  | 10 req/min        | Hobby tier          |
| Notion     | ✓ OAuth (no tier)  | API rate limits   | N/A                 |
| GitHub     | ✓ (5K req/hour)    | 5,000 req/hour    | N/A                 |
| Serena     | ✓ Open source      | N/A               | N/A                 |
| Sequential | ✓ Open source      | N/A               | N/A                 |

## Unified Module Architecture

### Module Capability Types

Every module declares capabilities via bitmask:

```typescript
enum ModuleCapability {
  MCP = 1 << 0, // Provides MCP server
  HOOKS = 1 << 1, // Lifecycle hooks (precheck, configure, install)
  SUBAGENT = 1 << 2, // Defines subagent(s)
  SLASH_CMD = 1 << 3, // Defines slash command(s)
  OAUTH = 1 << 4, // Requires OAuth flow
  CLI_HELPER = 1 << 5, // Can use CLI for setup (e.g., gh)
  GIT_INSTALL = 1 << 6, // Installed via git URL
  HTTP_REMOTE = 1 << 7, // Can use HTTP remote endpoint
}
```

**Examples:**

- Sequential Thinking: `MCP` (just MCP, nothing else)
- Context7: `MCP` (simple MCP + API key)
- Notion: `MCP | OAUTH` (MCP with OAuth flow)
- GitHub: `MCP | CLI_HELPER` (MCP with gh CLI integration)
- Serena: `MCP | GIT_INSTALL | HOOKS` (Git install + lifecycle)
- EXA Researcher: `MCP | SUBAGENT | SLASH_CMD | HOOKS` (full orchestration)
- Basic Memory: `MCP | HOOKS` (MCP + project creation)

### Base Module Schema (YAML)

```yaml
# ftk-module.yaml - Base configuration
name: context7
version: 1.0.26
description: Code documentation retrieval with optional API key
capabilities:
  - mcp
conflicts:
  group: code-context-providers
  mutually_exclusive:
    - reftools

# MCP Configuration
mcp:
  package_name: "@upstash/context7-mcp"
  registry: npm
  node_version: ">=18.0.0"

# Secrets
secrets:
  - key: CONTEXT7_API_KEY
    prompt: "Enter Context7 API key (optional, press Enter for free tier)"
    optional: true
    storage: .env.mcp.secrets

# Optional: For modules with lifecycle needs
lifecycle:
  # Reference TypeScript file if complex logic needed
  hooks_file: ./context7-hooks.ts
```

### Advanced Module Schema (TypeScript)

For modules requiring lifecycle logic:

```typescript
// ftk-module.ts - Advanced configuration
import { FtkModule } from "@fluent-toolkit/module-base";

export class Context7Module extends FtkModule {
  // Inherit base YAML config
  static config = require("./ftk-module.yaml");

  // Optional lifecycle overrides
  async precheck(ctx: ModuleContext): Promise<PrecheckResult> {
    // Verify Node.js version
    const nodeVersion = await this.getCommandVersion("node");
    if (!this.satisfiesVersion(nodeVersion, ">=18.0.0")) {
      return {
        success: false,
        message: "Node.js 18.0.0 or higher required",
      };
    }
    return { success: true };
  }

  async configure(ctx: ModuleContext): Promise<ConfigureResult> {
    // Prompt for optional API key
    const apiKey = await this.promptForSecret("CONTEXT7_API_KEY", {
      optional: true,
      message: "Context7 API key (optional for free tier)",
    });

    if (!apiKey) {
      ctx.log.info("Using Context7 free tier (60 req/hour, public repos only)");
    }

    return {
      success: true,
      secrets: apiKey ? { CONTEXT7_API_KEY: apiKey } : {},
    };
  }
}
```

### OAuth Flow Module Pattern (Notion Example)

```typescript
import { FtkModule, OAuthFlow } from "@fluent-toolkit/module-base";

export class NotionModule extends FtkModule {
  static config = require("./ftk-module.yaml");

  async configure(ctx: ModuleContext): Promise<ConfigureResult> {
    // Start OAuth flow
    const oauth = new OAuthFlow({
      authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
      clientId: process.env.NOTION_CLIENT_ID,
      scopes: [
        "pages:read",
        "pages:write",
        "databases:read",
        "databases:write",
      ],
      callbackPath: "/oauth/callback",
    });

    ctx.log.info("Starting Notion OAuth flow...");
    ctx.log.info("Opening browser for authorization...");

    const token = await oauth.execute();

    ctx.log.success("Notion token acquired!");

    return {
      success: true,
      secrets: {
        NOTION_TOKEN: token.access_token,
        NOTION_REFRESH_TOKEN: token.refresh_token,
        NOTION_TOKEN_EXPIRES_AT: token.expires_at,
      },
    };
  }

  // Optional: Token refresh logic
  async refreshToken(ctx: ModuleContext): Promise<void> {
    const refreshToken = ctx.secrets.get("NOTION_REFRESH_TOKEN");
    // ... refresh logic
  }
}
```

### CLI-Assisted Module Pattern (GitHub Example)

```typescript
export class GitHubModule extends FtkModule {
  static config = require("./ftk-module.yaml");

  async configure(ctx: ModuleContext): Promise<ConfigureResult> {
    // Check if gh CLI is available
    if (await this.commandExists("gh")) {
      ctx.log.info(
        "GitHub CLI detected! Attempting automatic token retrieval...",
      );

      try {
        const token = await this.runCommand("gh auth token");
        ctx.log.success("Token retrieved from gh CLI!");

        return {
          success: true,
          secrets: { GITHUB_PERSONAL_ACCESS_TOKEN: token },
        };
      } catch (error) {
        ctx.log.warn(
          "Failed to get token from gh CLI, falling back to manual...",
        );
      }
    }

    // Fallback: Manual guide
    ctx.log.info("GitHub CLI not available or failed.");
    ctx.log.info("Please follow the guide to create a personal access token:");
    ctx.log.info(
      "  https://github.com/Spantree/fluent-toolkit/blob/main/modules/github/SETUP.md",
    );

    const token = await this.promptForSecret("GITHUB_PERSONAL_ACCESS_TOKEN", {
      required: true,
      message: "Paste your GitHub personal access token",
    });

    return {
      success: true,
      secrets: { GITHUB_PERSONAL_ACCESS_TOKEN: token },
    };
  }
}
```

### Git-Based Installation Pattern (Serena Example)

```typescript
export class SerenaModule extends FtkModule {
  static config = require("./ftk-module.yaml");

  async precheck(ctx: ModuleContext): Promise<PrecheckResult> {
    // Verify uvx is installed
    if (!(await this.commandExists("uvx"))) {
      return {
        success: false,
        message:
          "uvx not found. Install via: https://docs.astral.sh/uv/getting-started/installation",
      };
    }
    return { success: true };
  }

  async configure(ctx: ModuleContext): Promise<ConfigureResult> {
    // Prompt for context type
    const context = await ctx.prompt.select({
      message: "Select Serena context",
      choices: [
        {
          value: "ide-assistant",
          label: "IDE Assistant (recommended for Claude Code)",
        },
        { value: "search", label: "Search (broad codebase queries)" },
        {
          value: "refactor",
          label: "Refactor (safe multi-step transformations)",
        },
        { value: "review", label: "Review (code quality analysis)" },
        { value: "explain", label: "Explain (natural language summaries)" },
      ],
      default: "ide-assistant",
    });

    // Prompt for projects (multi-select, max 3)
    const projects = await ctx.prompt.multiInput({
      message: "Enter project directories (up to 3, press Enter to finish)",
      max: 3,
      validate: (value) => {
        // Check if directory exists
        return fs.existsSync(value);
      },
    });

    // Dashboard flag
    const enableDashboard = await ctx.prompt.confirm({
      message: "Enable web dashboard? (localhost:9120)",
      default: false,
    });

    return {
      success: true,
      config: {
        context,
        projects,
        enableDashboard,
      },
    };
  }

  async install(ctx: ModuleContext): Promise<InstallResult> {
    const { context, projects, enableDashboard } = ctx.moduleConfig;

    // Generate MCP server command
    const command = "uvx";
    const args = [
      "--from",
      "git+https://github.com/oraios/serena",
      "serena",
      "start-mcp-server",
      "--context",
      context,
      ...projects.flatMap((p) => ["--project", p]),
      "--enable-web-dashboard",
      String(enableDashboard),
    ];

    ctx.mcpConfig.addServer("serena", {
      command,
      args,
    });

    return { success: true };
  }
}
```

## Complex Orchestration: EXA Researcher

### Multi-Capability Module

```yaml
# exa-researcher/ftk-module.yaml
name: exa-researcher
version: 1.0.0
description: AI-powered deep research with automatic caching
capabilities:
  - mcp # Uses EXA MCP server
  - subagent # Provides dedicated research subagent
  - slash_cmd # Provides /exa-research command
  - hooks # Conditional logic based on Basic Memory

dependencies:
  - module: exa
    reason: "Requires EXA MCP server for deep research API"
  - module: basic-memory
    optional: true
    reason: "Enhanced caching with observations and relations"

mcp:
  package_name: exa-mcp-server
  registry: npm

subagents:
  - file: .claude/agents/exa-researcher.md
    capabilities: ["research", "web-search", "analysis"]

slash_commands:
  - file: .claude/commands/exa-research.md
    name: /exa-research
```

### Orchestration Logic

```typescript
export class EXAResearcherModule extends FtkModule {
  static config = require("./ftk-module.yaml");

  async configure(ctx: ModuleContext): Promise<ConfigureResult> {
    // Check if Basic Memory is installed
    const hasBasicMemory = ctx.isModuleInstalled("basic-memory");

    if (hasBasicMemory) {
      ctx.log.info(
        "Basic Memory detected - research will be cached with annotations",
      );
    } else {
      ctx.log.info(
        "Basic Memory not installed - research will be cached to .cache/exa/",
      );
    }

    // Select default model
    const model = await ctx.prompt.select({
      message: "Select default EXA research model",
      choices: [
        { value: "exa-research", label: "Standard (45s p50, balanced)" },
        { value: "exa-research-fast", label: "Fast (30s p50, simple queries)" },
        {
          value: "exa-research-pro",
          label: "Pro (90s p50, complex multi-step)",
        },
      ],
      default: "exa-research",
    });

    return {
      success: true,
      config: {
        hasBasicMemory,
        defaultModel: model,
      },
    };
  }

  async install(ctx: ModuleContext): Promise<InstallResult> {
    const { hasBasicMemory } = ctx.moduleConfig;

    // Install subagent
    await ctx.installSubagent(".claude/agents/exa-researcher.md", {
      variables: {
        HAS_BASIC_MEMORY: hasBasicMemory,
      },
    });

    // Install slash command
    await ctx.installSlashCommand(".claude/commands/exa-research.md");

    // Create cache directory if Basic Memory not installed
    if (!hasBasicMemory) {
      await fs.promises.mkdir(".cache/exa", { recursive: true });

      // Add to .gitignore
      await this.appendToGitignore(".cache/");
    }

    return { success: true };
  }
}
```

## Unified Toolchain Workflow

### Installation Flow

```
ftk init
  ↓
┌─────────────────────────────────────────┐
│ 1. Detect existing MCP servers         │
│    - Read .mcp.json                     │
│    - Detect Basic Memory project        │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 2. Present module selection             │
│                                         │
│  [ ] Basic Memory (project management)  │
│  [ ] Sequential Thinking (reasoning)     │
│                                         │
│  Code Context (choose one):             │
│    ( ) Context7 (simple, free tier)     │
│    ( ) RefTools (token-efficient)       │
│                                         │
│  AI Search (choose one or both):        │
│    [ ] EXA (semantic research)          │
│    [ ] Tavily (real-time search)        │
│                                         │
│  [ ] FireCrawl (web scraping)           │
│  [ ] Notion (workspace integration)     │
│  [ ] GitHub (repository ops)            │
│  [ ] Serena (IDE-level code nav)        │
│  [ ] EXA Researcher (orchestration)     │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 3. Validate dependencies & conflicts    │
│    - Check mutual exclusivity           │
│    - Verify dependencies exist          │
│    - Warn about optional dependencies   │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 4. Execute lifecycle hooks              │
│    For each module:                     │
│      precheck() → configure() →         │
│      install() → validate()             │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 5. Generate unified configs             │
│    - .mcp.json (MCP servers)            │
│    - .env.mcp.secrets (API keys/tokens) │
│    - CLAUDE.md (system prompt embeds)   │
│    - .claude/agents/ (subagents)        │
│    - .claude/commands/ (slash commands) │
└─────────────────────────────────────────┘
```

### System Prompt Embedding Strategy

**Minimal Context (Always Embedded):**

```markdown
# Available MCP Servers

- **basic-memory**: Local-first knowledge graph (search, write, canvas)
- **context7**: Code documentation retrieval
- **sequential-thinking**: Transparent reasoning with visible steps
- **exa**: AI-powered web search and research
- **firecrawl**: Web scraping and content extraction

# Available Subagents

- **exa-researcher**: Deep research with automatic caching (use for complex research)

# Available Slash Commands

- **/exa-research**: AI-powered deep research with caching
```

**Rich Context (On-Demand Expansion):**

When user mentions "research" or "deep dive":

```markdown
# EXA Researcher Details

**Capabilities**: Multi-step research, source synthesis, automatic caching

**When to Use**:

- Complex questions requiring multiple sources
- Market research or competitive analysis
- Technical deep dives on unfamiliar topics

**Caching**:

- With Basic Memory: Results saved to `research/` with observations and relations
- Without Basic Memory: Results saved to `.cache/exa/`

**Models**:

- `exa-research-fast`: Simple queries (30s)
- `exa-research`: Balanced (45s) - default
- `exa-research-pro`: Complex multi-step (90s)
```

## Migration Priorities

### Critical: GitHub MCP Deprecation

**Deadline**: November 19, 2025

**Action Items**:

1. Warn users during installation
2. Provide migration guide to new package
3. Auto-detect deprecated package in existing setups
4. Offer automated migration command

**Migration Command**:

```bash
ftk migrate github-mcp
  → Detects old @modelcontextprotocol/server-github
  → Prompts to install new package
  → Transfers existing token
  → Updates .mcp.json
```

### High Priority: HTTP Remote Options

**Tavily** and **RefTools** support HTTP remote endpoints - reduce local installation overhead:

```json
{
  "mcpServers": {
    "tavily": {
      "url": "https://mcp.tavily.com/mcp/?tavilyApiKey=YOUR_KEY"
    },
    "reftools": {
      "url": "https://api.ref.tools/mcp",
      "headers": {
        "x-ref-api-key": "YOUR_KEY"
      }
    }
  }
}
```

**Recommendation**: Offer both installation methods, prefer remote for simplicity.

## Observations

- [fact] Nine distinct MCP servers researched span authentication complexity from zero-config to OAuth flows #architecture #mcp
- [fact] Context7 and RefTools are mutually exclusive due to MCP alias binding limitations #conflicts #code-context
- [method] Module capability bitmask enables flexible composition of MCP + hooks + subagents + slash commands #design #capabilities
- [fact] GitHub MCP server deprecated with migration deadline November 19, 2025 requiring urgent action #deprecation #migration
- [method] Tavily and RefTools support HTTP remote endpoints reducing local installation complexity #http #remote #simplification
- [fact] EXA provides three research models (fast/standard/pro) with distinct performance profiles for use case optimization #exa #performance
- [method] OAuth flow modules require local HTTP server on ephemeral port with SSE for token delivery #oauth #sse #notion
- [fact] Serena supports five context types (ide-assistant/search/refactor/review/explain) each optimized for specific workflows #serena #contexts
- [security] All API key modules store secrets in .env.mcp.secrets with 600 file permissions for consistent security #security #secrets
- [method] System prompt embedding uses minimal context by default with on-demand rich expansion for relevant capabilities #prompts #context

## Relations

- requires [[design/ftk-module-system-use-cases]] (original design requirements)
- documented_in [[research/2025-01-13-02-00-00-context7-mcp-server-integration-requirements]] (Context7 authentication)
- documented_in [[research/2025-01-13-00-00-00-ref-tools-mcp-server-integration]] (RefTools HTTP mode)
- documented_in [[research/2025-01-13-76-15-exa-mcp-deep-research-api]] (EXA polling workflow)
- documented_in [[research/2025-11-13-00-00-00-tavali-mcp-server-integration]] (Tavily remote endpoint)
- documented_in [[research/2025-11-13-102-980-fire-crawl-mcp-server-integration]] (FireCrawl package name)
- documented_in [[research/2025-11-13-23-00-00-sequential-thinking-mcp-server]] (zero-config reference)
- documented_in [[research/2025-11-13-00-00-00-notion-mcp-oauth-authentication]] (OAuth SSE flow)
- documented_in [[research/2025-11-13-00-00-00-git-hub-mcp-token-setup]] (GitHub deprecation)
- documented_in [[research/2025-11-13-00-00-00-serena-mcp-git-installation]] (Git+UVX install)

## Tool Filtering and Context Optimization

### Problem Statement

MCP servers often expose dozens of tools, creating three major issues:

1. **LLM confusion** - Too many tools make it harder for the model to select the right one
2. **Token overhead** - Tool definitions consume precious context window
3. **Security risk** - Unwanted tools (especially write operations) may be exposed

### Native Server-Side Filtering

Some MCP servers support native tool filtering via configuration:

**EXA MCP Server**:

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": [
        "-y",
        "exa-mcp-server",
        "--tools",
        "deep_researcher_start,deep_researcher_check"
      ]
    }
  }
}
```

Filters out: `web_search_exa`, `company_research_exa`, `linkedin_search_exa`, `crawling_exa`, `get_code_context_exa`

**NVIDIA NeMo Agent Toolkit**:

```bash
nat mcp --config_file config.yml \
  --tool_names tool1 \
  --tool_names tool2
```

**GitHub MCP Server**: Configurable via VS Code settings (tool selection per conversation)

### MCP Gateway/Proxy Solutions

Multiple production-ready gateway tools can handle filtering across all MCP servers:

#### **LiteLLM MCP Gateway** (Recommended for ftk)

**Capabilities**:

- Unified endpoint for all MCP tools
- Per-key/team/organization access control
- Tool filtering and permission management
- Cost tracking and quota enforcement
- Supports stdio, SSE, HTTP transports

**Architecture**:

```
Claude Code
    ↓
  .mcp.json → LiteLLM Gateway (localhost:4000)
    ↓
  ┌─────────────┬─────────────┬─────────────┐
  EXA MCP     Context7      FireCrawl
  (filtered)  (filtered)    (filtered)
```

**Configuration Example**:

```yaml
# litellm-config.yaml
general_settings:
  store_model_in_db: true
  supported_db_objects: ["mcp"]

mcp_servers:
  - server_name: exa
    package: exa-mcp-server
    registry: npm
    allowed_tools:
      - deep_researcher_start
      - deep_researcher_check

  - server_name: github
    package: "@modelcontextprotocol/server-github"
    registry: npm
    allowed_tools:
      - create_or_update_file
      - get_file_contents
      - search_repositories
```

#### **Other Gateway Options**

- **ContextForge MCP Gateway** (IBM Open Source) - https://github.com/IBM/mcp-context-forge
- **Envoy AI Gateway** (Production-Grade) - First-class MCP support with enterprise features
- **ToolHive** (Stacklok) - Registry with built-in filtering
- **Prompt Security MCP Gateway** - Security-focused with risk assessment

### FTK Tool Filtering Strategy

Implement three-tier filtering approach:

#### **Tier 1: Server-Native Filtering** (When Available)

```yaml
# ftk-module.yaml
name: exa
mcp:
  package_name: exa-mcp-server
  tool_filtering:
    supported: true
    flag: --tools
    presets:
      minimal:
        description: "Deep research only (2 tools)"
        tools: [deep_researcher_start, deep_researcher_check]
      research:
        description: "Research + web search (3 tools)"
        tools: [deep_researcher_start, deep_researcher_check, web_search_exa]
      full:
        description: "All tools (7 tools)"
        tools: "*"
```

#### **Tier 2: Gateway-Based Filtering** (Universal)

```bash
ftk gateway init
  → Installs LiteLLM MCP Gateway
  → Migrates existing .mcp.json to gateway
  → Prompts for tool filtering per server
```

#### **Tier 3: Presets & Documentation** (Fallback)

User-friendly presets without requiring gateway deployment.

### Token Savings Analysis

| Configuration | Tools | Tokens | Savings |
| ------------- | ----- | ------ | ------- |
| EXA Full      | 7     | ~3,500 | 0%      |
| EXA Research  | 3     | ~1,500 | 57%     |
| EXA Minimal   | 2     | ~1,000 | 71%     |

**Impact**: 100-turn conversation × 2K tokens saved = 200K tokens saved ($2.00 @ $0.01/1K)

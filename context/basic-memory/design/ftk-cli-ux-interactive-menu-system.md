---
title: FTK CLI UX Interactive Menu System
type: note
permalink: design/ftk-cli-ux-interactive-menu-system
tags:
  - cli-ux
  - ink-framework
  - nested-menus
  - token-tracking
  - extensibility
  - tool-filtering
  - oauth-flows
  - accessibility
  - progressive-disclosure
  - plugin-architecture
---

# FTK CLI UX Interactive Menu System

## Overview

This document defines the extensible, interactive CLI user experience for fluent-toolkit (ftk) using Ink (React for terminals). The system provides nested menu navigation, per-server customization, real-time token tracking, and a plugin-like architecture for future enhancements.

## Architecture

### Technology Stack

**Primary Framework**: Ink v4.x + Deno v2+

```typescript
import { Box, render, Text } from "npm:ink";
import SelectInput from "npm:ink-select-input";
import TextInput from "npm:ink-text-input";
import Spinner from "npm:ink-spinner";
```

**State Management**: Zustand for React-style global state

```typescript
import create from "npm:zustand";

interface WizardState {
  selectedServers: Set<string>;
  serverConfigs: Map<string, ServerConfig>;
  tokenMetrics: TokenMetrics;
  currentView: ViewStack;
}
```

**Alternative for Simple Prompts**: Cliffy for non-interactive fallback

### Component Hierarchy

```
<App>
  ├── <Header> (breadcrumb navigation + token meter)
  ├── <MainMenu>
  │   ├── <ServerCategoryList>
  │   ├── <ServerSelectionList>
  │   └── <ConflictWarningBanner>
  ├── <ServerConfigurationView>
  │   ├── <ToolFilteringPanel>
  │   ├── <CustomSettingsPanel>
  │   └── <TokenSavingsDisplay>
  ├── <TokenTrackingDashboard>
  │   ├── <SystemPromptMeter>
  │   ├── <MCPToolsMeter>
  │   └── <RunningTotalChart>
  └── <Footer> (navigation hints + action buttons)
```

## Navigation System

### Breadcrumb Navigation

```
ftk init > Code Context > Context7 > Tool Configuration
         ^              ^          ^                   ^
      Level 0        Level 1    Level 2             Level 3
```

**Implementation**:

```typescript
interface NavigationFrame {
  title: string;
  view: ViewComponent;
  state: any; // Snapshot of view-specific state
}

const navigationStack: NavigationFrame[] = [];

// Navigate forward
const push = (frame: NavigationFrame) => navigationStack.push(frame);

// Navigate back (ESC key)
const pop = () => navigationStack.pop();
```

### Keyboard Shortcuts

| Key    | Action                          |
| ------ | ------------------------------- |
| ↑/↓    | Navigate menu items             |
| Enter  | Select/confirm                  |
| ESC    | Back to previous view           |
| Space  | Toggle selection (multi-select) |
| Tab    | Switch focus between panels     |
| Ctrl+S | Save and continue               |
| Ctrl+C | Cancel wizard                   |

## MCP Server Selection Interface

### Server Category View

```
┌─ Select MCP Server Category ─────────────────────────── Tokens: 12.5K ─┐
│                                                                          │
│  🔍 AI-Powered Search                                    [3 servers]   │
│  📚 Code Context & Documentation                         [2 servers]   │
│  🌐 Web Scraping & Research                             [2 servers]   │
│  📝 Note-Taking & Knowledge Management                   [2 servers]   │
│  🧠 Reasoning & Problem Solving                          [1 server]    │
│  🔧 Development Tools                                    [2 servers]   │
│                                                                          │
│  ✓ 0 servers selected                                                  │
│                                                                          │
└─ ↑/↓: Navigate | Enter: Select | ESC: Back ────────────────────────────┘
```

### Server Selection List

```
┌─ AI-Powered Search > Select Servers ────────────────── Tokens: 12.5K ─┐
│                                                                          │
│  ☐ EXA MCP Server                                      [API Key]      │
│     Deep research, web search, LinkedIn, crawling                      │
│     Tokens: ~3,500 (full) | ~1,000 (minimal)                          │
│                                                                          │
│  ☐ Tavily MCP Server                    ⚠️ Conflicts with: EXA       │
│     Advanced web search and research                   [API Key]      │
│     Tokens: ~2,800 (full) | ~800 (minimal)                            │
│                                                                          │
└─ Space: Toggle | Enter: Configure | ESC: Back ─────────────────────────┘
```

**Visual Indicators**:

- `☐` Unselected
- `☑` Selected
- `⚠️` Conflict warning (soft or hard)
- `[API Key]` Authentication type
- `[OAuth]` OAuth required
- `[Zero Config]` No configuration needed

### Conflict Detection

**Hard Conflicts** (mutually exclusive):

```
┌─ Warning: Mutual Exclusivity Detected ──────────────────────────────────┐
│                                                                          │
│  ⛔ Context7 and RefTools cannot be enabled simultaneously              │
│                                                                          │
│  Reason: Both provide overlapping code context tools with incompatible │
│          indexing strategies. Choose one:                               │
│                                                                          │
│  • Context7: Official library docs, version-specific code examples      │
│  • RefTools: Codebase-wide semantic search and navigation              │
│                                                                          │
│  [ Keep Context7 ]  [ Switch to RefTools ]  [ Cancel ]                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Soft Conflicts** (recommendations):

```
┌─ Recommendation ─────────────────────────────────────────────────────────┐
│                                                                          │
│  💡 You've selected both EXA and Tavily                                 │
│                                                                          │
│  Both provide web search capabilities. Consider choosing one to reduce │
│  token overhead:                                                        │
│                                                                          │
│  • EXA: Deep research (AI-powered), semantic search, LinkedIn          │
│  • Tavily: Fast web search, real-time results, news aggregation        │
│                                                                          │
│  [ Keep Both ]  [ Keep EXA Only ]  [ Keep Tavily Only ]                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Per-Server Configuration

### Tool Filtering Panel

**EXA Example** (native `--tools` support):

```
┌─ EXA MCP Server > Tool Configuration ──────────────── Tokens: 15.3K ─┐
│                                                                         │
│  Select Tools to Enable:                                               │
│                                                                         │
│  Presets:                                                              │
│  ○ Minimal (2 tools)           Tokens: ~1,000    [Savings: 71%] ⭐    │
│  ● Research (3 tools)          Tokens: ~1,500    [Savings: 57%]       │
│  ○ Full (7 tools)              Tokens: ~3,500    [Savings: 0%]        │
│                                                                         │
│  Custom Selection:                                                     │
│  ☑ deep_researcher_start               ~500 tokens                    │
│  ☑ deep_researcher_check               ~500 tokens                    │
│  ☑ web_search_exa                      ~500 tokens                    │
│  ☐ company_research_exa                ~500 tokens                    │
│  ☐ crawling_exa                        ~500 tokens                    │
│  ☐ linkedin_search_exa                 ~500 tokens                    │
│  ☐ get_code_context_exa              ~1,000 tokens                    │
│                                                                         │
│  Total: 1,500 tokens  (2,000 tokens saved from full)                  │
│                                                                         │
└─ Space: Toggle | Tab: Switch Preset/Custom | Enter: Save ──────────────┘
```

**Basic Memory Example** (custom settings):

```
┌─ Basic Memory MCP > Configuration ─────────────────── Tokens: 14.8K ─┐
│                                                                         │
│  Project Name:                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ fluent-toolkit                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Project Path:                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ /Users/cedric/src/spantree-fluent/fluent-toolkit                │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Preferences:                                                          │
│  ☑ Use kebab-case for filenames (recommended)                         │
│  ☑ Auto-format notes with Prettier after creation                     │
│  ☐ Enable web dashboard on localhost:9876                             │
│                                                                         │
│  Context Directory:                                                    │
│  ○ Use default (context/)                                             │
│  ● Custom path: context/basic-memory/                                 │
│                                                                         │
└─ Enter: Save | ESC: Cancel ─────────────────────────────────────────────┘
```

**FireCrawl Example** (API key + tool filtering via LiteLLM):

```
┌─ FireCrawl MCP > Configuration ────────────────────── Tokens: 16.2K ─┐
│                                                                         │
│  API Key:                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ fc-••••••••••••••••••••••••••••••••                             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Tool Selection (via LiteLLM Gateway):                                │
│                                                                         │
│  Presets:                                                              │
│  ○ Minimal (scrape only)       Tokens: ~800     [Savings: 60%]        │
│  ● Standard (scrape + search)  Tokens: ~1,200   [Savings: 40%]        │
│  ○ Full (all 5 tools)          Tokens: ~2,000   [Savings: 0%]         │
│                                                                         │
│  Custom:                                                               │
│  ☑ firecrawl_scrape            ~600 tokens                            │
│  ☑ firecrawl_search            ~600 tokens                            │
│  ☐ firecrawl_crawl             ~400 tokens                            │
│  ☐ firecrawl_map               ~200 tokens                            │
│  ☐ firecrawl_extract           ~200 tokens                            │
│                                                                         │
│  Rate Limit: 10 requests/min (free tier)                              │
│                                                                         │
└─ Enter: Save | ESC: Cancel ─────────────────────────────────────────────┘
```

### OAuth Configuration Flow

**Notion Example**:

```
┌─ Notion MCP > OAuth Setup ─────────────────────────── Tokens: 14.5K ─┐
│                                                                         │
│  Step 1 of 3: Browser Authorization                                   │
│                                                                         │
│  Opening browser for OAuth authorization...                            │
│                                                                         │
│  ⏳ Waiting for authorization callback...                              │
│                                                                         │
│  Local callback server: http://localhost:58291/oauth/callback          │
│                                                                         │
│  If browser doesn't open automatically, visit:                         │
│  https://api.notion.com/v1/oauth/authorize?client_id=...               │
│                                                                         │
│  [ Cancel ]                                    Timeout: 2:00 minutes   │
│                                                                         │
└──────────────────────────────────────────────────────────────────────────┘

# After successful authorization:

┌─ Notion MCP > OAuth Setup ─────────────────────────── Tokens: 14.5K ─┐
│                                                                         │
│  Step 2 of 3: Token Received                                          │
│                                                                         │
│  ✓ Authorization successful!                                           │
│                                                                         │
│  Scopes granted:                                                       │
│  • pages:read                                                          │
│  • pages:write                                                         │
│  • databases:read                                                      │
│  • databases:write                                                     │
│  • comments:write                                                      │
│                                                                         │
│  Token expires: 2025-12-13 00:00:00 (30 days)                         │
│                                                                         │
│  [ Continue ]                                                          │
│                                                                         │
└──────────────────────────────────────────────────────────────────────────┘
```

## Token Tracking Dashboard

### Real-Time Display

```
┌─ Token Usage Tracking ──────────────────────────────────────────────────┐
│                                                                          │
│  System Prompt:                      2,500 tokens  ████████░░░░░ 20%   │
│  MCP Tool Definitions:               9,800 tokens  ████████████████ 80% │
│  ───────────────────────────────────────────────────────────────────    │
│  Total Context Overhead:            12,300 tokens                       │
│                                                                          │
│  Breakdown by Server:                                                   │
│                                                                          │
│  📚 Context7           1,200 tokens  ███░░░░░░░░░░░░░ 12%              │
│  🔍 EXA (minimal)      1,000 tokens  ██░░░░░░░░░░░░░░ 10%              │
│  🌐 FireCrawl          1,200 tokens  ███░░░░░░░░░░░░░ 12%              │
│  📝 Basic Memory       2,800 tokens  ██████░░░░░░░░░░ 29%              │
│  🔧 GitHub             1,500 tokens  ████░░░░░░░░░░░░ 15%              │
│  🧠 Sequential           800 tokens  ██░░░░░░░░░░░░░░  8%              │
│  🐙 Serena             1,300 tokens  ███░░░░░░░░░░░░░ 13%              │
│                                                                          │
│  Optimization Opportunities:                                            │
│  💡 EXA minimal preset saves 2,500 tokens vs full (71% reduction)      │
│  💡 FireCrawl standard preset saves 800 tokens vs full (40% reduction) │
│                                                                          │
│  Model: Claude Sonnet 4.5 (200K context window)                        │
│  Remaining: 187,700 tokens available (93.9%)                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Token Calculation Logic

**System Prompt Sources**:

1. `.claude/CLAUDE.md` (global user instructions)
2. `CLAUDE.md` (project-specific instructions)
3. Server-specific CLAUDE.md fragments from `registry/mcp-servers/{name}/claude.md`

```typescript
interface TokenMetrics {
  systemPrompt: {
    global: number; // ~/.claude/CLAUDE.md
    project: number; // ./CLAUDE.md
    serverFragments: Map<string, number>; // Per-server additions
    total: number;
  };
  mcpTools: {
    perServer: Map<string, number>;
    total: number;
  };
  grandTotal: number;
}

// Token counting (approximate)
const estimateTokens = (text: string): number => {
  // Rule of thumb: ~4 characters per token for English
  return Math.ceil(text.length / 4);
};

// Dynamic calculation as servers are added/removed
const recalculateTokens = (state: WizardState): TokenMetrics => {
  const metrics: TokenMetrics = {
    systemPrompt: {
      global: 0,
      project: 0,
      serverFragments: new Map(),
      total: 0,
    },
    mcpTools: { perServer: new Map(), total: 0 },
    grandTotal: 0,
  };

  // Read and measure system prompts
  metrics.systemPrompt.global = estimateTokens(
    Deno.readTextFileSync("~/.claude/CLAUDE.md"),
  );
  metrics.systemPrompt.project = estimateTokens(
    Deno.readTextFileSync("./CLAUDE.md"),
  );

  // Per-server fragments
  for (const serverId of state.selectedServers) {
    const fragmentPath = `registry/mcp-servers/${serverId}/claude.md`;
    const fragmentText = Deno.readTextFileSync(fragmentPath);
    const tokens = estimateTokens(fragmentText);
    metrics.systemPrompt.serverFragments.set(serverId, tokens);
  }

  metrics.systemPrompt.total = metrics.systemPrompt.global +
    metrics.systemPrompt.project +
    Array.from(metrics.systemPrompt.serverFragments.values()).reduce(
      (a, b) => a + b,
      0,
    );

  // MCP tool definitions (from generated .mcp.json)
  for (const [serverId, config] of state.serverConfigs) {
    const toolTokens = estimateMCPToolTokens(serverId, config);
    metrics.mcpTools.perServer.set(serverId, toolTokens);
  }

  metrics.mcpTools.total = Array.from(
    metrics.mcpTools.perServer.values(),
  ).reduce((a, b) => a + b, 0);
  metrics.grandTotal = metrics.systemPrompt.total + metrics.mcpTools.total;

  return metrics;
};
```

**MCP Tool Token Estimation**:

```typescript
// Approximate token counts per tool (based on JSON-RPC schema definitions)
const TOOL_TOKEN_ESTIMATES: Record<string, number> = {
  // EXA
  deep_researcher_start: 500,
  deep_researcher_check: 500,
  web_search_exa: 500,
  company_research_exa: 500,
  crawling_exa: 500,
  linkedin_search_exa: 500,
  get_code_context_exa: 1000,

  // FireCrawl
  firecrawl_scrape: 600,
  firecrawl_search: 600,
  firecrawl_crawl: 400,
  firecrawl_map: 200,
  firecrawl_extract: 200,

  // Context7
  "resolve-library-id": 300,
  "get-library-docs": 900,

  // Basic Memory (16 tools)
  write_note: 200,
  read_note: 150,
  edit_note: 200,
  search_notes: 180,
  // ... other Basic Memory tools
};

const estimateMCPToolTokens = (
  serverId: string,
  config: ServerConfig,
): number => {
  const enabledTools = config.toolFiltering?.tools || "*";

  if (enabledTools === "*") {
    // Return full tool set estimate for this server
    return getFullToolSetTokens(serverId);
  }

  // Calculate tokens for selected tools only
  return (enabledTools as string[])
    .map((tool) => TOOL_TOKEN_ESTIMATES[tool] || 200)
    .reduce((a, b) => a + b, 0);
};
```

## Complete Wizard Flow Example

### Main Menu

```
┌─ fluent-toolkit (ftk) Setup Wizard ─────────────────── Tokens: 12.5K ─┐
│                                                                          │
│  Welcome! This wizard will help you configure MCP servers for           │
│  Claude Code.                                                           │
│                                                                          │
│  What would you like to do?                                             │
│                                                                          │
│  → Select MCP Servers                                                   │
│    Configure Selected Servers (0 selected)                             │
│    Review Token Usage                                                   │
│    Save and Generate .mcp.json                                          │
│    Exit                                                                 │
│                                                                          │
│  💡 Tip: Start by selecting servers, then customize their settings      │
│                                                                          │
└─ ↑/↓: Navigate | Enter: Select ─────────────────────────────────────────┘
```

### After Server Selection

```
┌─ fluent-toolkit (ftk) Setup Wizard ─────────────────── Tokens: 18.3K ─┐
│                                                                          │
│  What would you like to do?                                             │
│                                                                          │
│    Select MCP Servers                                                   │
│  → Configure Selected Servers (4 selected) ⚠️ 2 need configuration      │
│    Review Token Usage                                                   │
│    Save and Generate .mcp.json                                          │
│    Exit                                                                 │
│                                                                          │
│  Selected Servers:                                                      │
│  ✓ Context7                      [Configured]                           │
│  ⚠️ EXA MCP Server               [Needs API Key]                        │
│  ✓ Sequential Thinking           [Zero Config]                          │
│  ⚠️ Basic Memory                 [Needs Project Path]                   │
│                                                                          │
└─ ↑/↓: Navigate | Enter: Select ─────────────────────────────────────────┘
```

### Configuration Queue

```
┌─ Configure Selected Servers ────────────────────────── Tokens: 18.3K ─┐
│                                                                          │
│  2 servers need configuration:                                          │
│                                                                          │
│  → EXA MCP Server                                                       │
│     Status: Missing API key                                             │
│     Action: Enter API key or skip                                       │
│                                                                          │
│    Basic Memory                                                         │
│     Status: Missing project path                                        │
│     Action: Configure project and preferences                           │
│                                                                          │
│  [ Configure All ]  [ Skip ]  [ Back ]                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Final Review

```
┌─ Review Configuration ──────────────────────────────── Tokens: 18.3K ─┐
│                                                                          │
│  Ready to generate .mcp.json with the following configuration:          │
│                                                                          │
│  ✓ Context7                                                             │
│    • Authentication: API Key (configured)                               │
│    • Tools: 2/2 enabled                           1,200 tokens          │
│                                                                          │
│  ✓ EXA MCP Server                                                       │
│    • Authentication: API Key (configured)                               │
│    • Tools: 2/7 enabled (minimal preset)          1,000 tokens          │
│    • Savings: 2,500 tokens (71%)                                        │
│                                                                          │
│  ✓ Sequential Thinking                                                  │
│    • Authentication: None required                                      │
│    • Tools: 1/1 enabled                             800 tokens          │
│                                                                          │
│  ✓ Basic Memory                                                         │
│    • Authentication: None required                                      │
│    • Project: fluent-toolkit                                            │
│    • Tools: 16/16 enabled                         2,800 tokens          │
│    • Preferences: kebab-case filenames, auto-format                     │
│                                                                          │
│  Total Token Overhead: 18,300 tokens (9.2% of 200K context)            │
│                                                                          │
│  Files to be created/updated:                                           │
│  • .mcp.json                                                            │
│  • .env.mcp.secrets (with API keys)                                     │
│  • CLAUDE.md (with server usage instructions)                           │
│  • .gitignore (add .env.mcp.secrets if not present)                     │
│                                                                          │
│  [ Generate Configuration ]  [ Edit ]  [ Cancel ]                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Extensibility Architecture

### Plugin System for Custom Panels

```typescript
interface ConfigPanelPlugin {
  serverId: string;
  component: React.ComponentType<{
    config: ServerConfig;
    onChange: (config: ServerConfig) => void;
  }>;
  validate?: (config: ServerConfig) => string | null; // Error message or null
}

const registerConfigPanel = (plugin: ConfigPanelPlugin) => {
  configPanelRegistry.set(plugin.serverId, plugin);
};

// Example: Custom panel for LiteLLM Gateway configuration
registerConfigPanel({
  serverId: "litellm-gateway",
  component: LiteLLMGatewayPanel,
  validate: (config) => {
    if (!config.upstreamServers || config.upstreamServers.length === 0) {
      return "At least one upstream server must be configured";
    }
    return null;
  },
});
```

### Custom Metrics Calculators

```typescript
interface MetricsPlugin {
  id: string;
  calculate: (state: WizardState) => { label: string; value: number; unit: string };
  display: (value: number) => React.ReactNode;
}

const registerMetric = (plugin: MetricsPlugin) => {
  metricsRegistry.set(plugin.id, plugin);
};

// Example: Cost estimation plugin
registerMetric({
  id: "estimated-cost-per-100-turns",
  calculate: (state) => {
    const totalTokens = state.tokenMetrics.grandTotal;
    const tokensPerTurn = totalTokens * 2; // Input + output overhead
    const costPer1M = 3.00; // Sonnet 4.5 input pricing
    const cost = (tokensPerTurn * 100 * costPer1M) / 1_000_000;
    return { label: "Est. Cost (100 turns)", value: cost, unit: "USD" };
  },
  display: (value) => <Text color="green">${value.toFixed(2)}</Text>,
});
```

### Wizard Step Extensions

```typescript
interface WizardStepPlugin {
  id: string;
  title: string;
  position:
    | "before-server-selection"
    | "after-server-selection"
    | "before-save";
  component: React.ComponentType<{
    state: WizardState;
    onComplete: () => void;
  }>;
  shouldShow?: (state: WizardState) => boolean;
}

const registerWizardStep = (plugin: WizardStepPlugin) => {
  wizardStepRegistry.set(plugin.id, plugin);
};

// Example: LiteLLM Gateway setup step (only shown if tool filtering needed)
registerWizardStep({
  id: "litellm-gateway-setup",
  title: "Configure LiteLLM Gateway",
  position: "after-server-selection",
  component: LiteLLMGatewaySetupWizard,
  shouldShow: (state) => {
    // Show if any selected server needs tool filtering but doesn't support native filtering
    return Array.from(state.selectedServers).some((serverId) => {
      const module = getModuleDefinition(serverId);
      return !module.mcp?.tool_filtering?.supported;
    });
  },
});
```

## Implementation Phases

### Phase 1: Core Navigation (MVP)

- Ink component structure with basic navigation
- Server category view + server selection list
- Simple configuration forms (text input for API keys)
- Basic token tracking (static estimates)
- .mcp.json generation

**Deliverables**:

- Working `ftk init` with keyboard navigation
- Support for 3 reference servers (Sequential, Context7, Basic Memory)
- Static token estimates displayed

### Phase 2: Advanced Configuration

- Tool filtering panels with presets
- Per-server custom settings (kebab-case toggle, etc.)
- OAuth flow integration (Notion)
- Conflict detection UI (hard + soft warnings)
- Dynamic token calculation

**Deliverables**:

- Tool filtering for EXA, FireCrawl
- OAuth wizard for Notion
- Real-time token recalculation
- Conflict warnings for Context7/RefTools, EXA/Tavily

### Phase 3: Token Optimization

- LiteLLM Gateway integration wizard
- Token savings recommendations
- Cost estimation metrics
- Visual token breakdown dashboard
- Optimization suggestions

**Deliverables**:

- Automatic LiteLLM setup if tool filtering needed
- Token savings displayed per server
- Cost-per-100-turns metric
- "What if" token scenarios

### Phase 4: Extensibility

- Plugin API for custom config panels
- Custom metrics calculators
- Wizard step extensions
- Theme customization
- Export/import configurations

**Deliverables**:

- Plugin SDK documentation
- 3 example plugins
- Configuration templates (presets)
- Theme system

## Design Principles

### 1. Progressive Disclosure

Show only relevant information at each step. Don't overwhelm with all options upfront.

**Example**: Tool filtering panel only appears after server is selected, not during initial server list.

### 2. Immediate Feedback

Every action provides instant visual feedback. Token counts update in real-time as configuration changes.

**Example**: Adding/removing tools immediately updates token meter and savings percentage.

### 3. Escape Hatches

Always provide a way back. ESC key navigates to previous view with state preserved.

**Example**: Deep in tool configuration → ESC → back to server config → ESC → back to server list → ESC → back to main menu.

### 4. Smart Defaults

Provide sensible defaults that work for most users. Advanced users can customize.

**Example**: EXA defaults to "research" preset (3 tools) rather than full (7 tools) or minimal (2 tools).

### 5. Error Prevention

Prevent invalid states rather than showing error messages after the fact.

**Example**: Disable "Save and Generate" button if required configuration is missing. Show "⚠️ 2 need configuration" instead.

## Accessibility Considerations

### Keyboard-Only Navigation

All functionality accessible via keyboard. No mouse required.

### Screen Reader Support

Use semantic terminal UI elements. Provide text descriptions for visual indicators.

```typescript
<Box>
  <Text aria-label="Warning: Mutual exclusivity conflict">⚠️</Text>
  <Text>Context7 and RefTools cannot be enabled simultaneously</Text>
</Box>;
```

### Color Blindness

Don't rely solely on color. Use symbols + color.

- ✓ Green checkmark (not just green)
- ⚠️ Yellow warning (not just yellow)
- ⛔ Red error (not just red)

### Terminal Compatibility

Test on multiple terminals (iTerm2, Terminal.app, Windows Terminal, Alacritty).

Fallback to ASCII art if Unicode not supported:

```typescript
const ICONS = {
  checkmark: supportsUnicode ? "✓" : "[x]",
  warning: supportsUnicode ? "⚠️" : "[!]",
  error: supportsUnicode ? "⛔" : "[X]",
};
```

## Testing Strategy

### Unit Tests

- Token calculation logic
- Configuration validation
- State management (Zustand store)

### Integration Tests

- Navigation flows (forward/back)
- Multi-step wizards (OAuth flow)
- Configuration file generation

### Visual Regression Tests

- Screenshot comparison of UI states
- Ensure consistent rendering across terminals

### Accessibility Tests

- Keyboard navigation paths
- Screen reader output validation

## Observations

- [method] Ink framework provides React-based component model for terminal UIs enabling familiar development patterns for complex CLI wizards #ink #cli #react
- [method] Nested menu system with breadcrumb navigation provides intuitive exploration of MCP server configuration options #navigation #ux #menus
- [fact] Real-time token tracking requires dynamic calculation as servers are added/removed with per-server breakdown for optimization #tokens #tracking #performance
- [method] Tool filtering presets (minimal/research/full) provide quick configuration with clear token savings percentages #presets #optimization #tools
- [security] Conflict detection prevents invalid configurations (Context7 vs RefTools hard conflict) before .mcp.json generation #conflicts #validation #configuration
- [method] Plugin architecture enables extensible configuration panels and custom metrics without modifying core wizard code #plugins #extensibility #architecture
- [method] Progressive disclosure pattern shows configuration options only when relevant reducing cognitive load #ux #design #simplicity
- [fact] OAuth flow integration requires ephemeral local server (localhost callback) with browser automation and timeout handling #oauth #authentication #flows
- [method] Token estimation uses 4 characters per token approximation for English text with server-specific tool definition counts #estimation #tokens #calculation
- [method] Keyboard-only navigation with consistent shortcuts (ESC=back, Space=toggle, Enter=confirm) ensures accessibility #keyboard #accessibility #navigation

## Relations

- requires [[ftk-module-system-use-cases]] (module system capabilities and constraints)
- implements [[unified-ftk-module-architecture-based-on-research-findings]] (architecture specification)
- uses Ink (React for terminals framework)
- uses Zustand (React state management)
- relates_to [[features/token-tracking-and-optimization]] (token calculation system)
- relates_to [[features/litellm-gateway-integration]] (tool filtering proxy)
- inspired_by Claude Code (Ink-based CLI wizard patterns)
- documented_in https://github.com/vadimdemedes/ink (Ink framework)
- documented_in https://github.com/pmndrs/zustand (Zustand state management)

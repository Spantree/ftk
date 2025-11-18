---
title: ftk-module-system-use-cases
type: note
permalink: design/ftk-module-system-use-cases
tags:
  - ftk
  - modules
  - architecture
  - use-cases
  - requirements
---

# FTK Module System Use Cases

## Overview

Requirements and use cases for the ftk module system, documenting the range from simple self-contained modules to complex orchestrated workflows with OAuth, conditional logic, and cross-module dependencies.

## Module Use Cases

### 1. Basic Memory

**Complexity**: Medium (lifecycle hooks, project setup)

**Requirements:**

- Check if Basic Memory project exists for current project root
- Prompt user to create project if not exists:
  - Option 1: Yes → auto-create project
  - Option 2: No → show manual command, wait for completion or skip
  - Option 3: Skip → proceed without Basic Memory
- Verify UV/UVX is installed (dependency check)
- Store project name for MCP server args

**Lifecycle:**

```
precheck() → verify UV/UVX installed
configure() → check project exists, prompt to create
install() → generate MCP config with --project=<name>
```

**Configuration:**

- MCP package: `basic-memory` (PyPI)
- Hooks: kebab-case validation, directory protection
- No API keys required

---

### 2. Context7 vs RefTools (Mutually Exclusive Group)

**Complexity**: Medium (optional secrets, mutually exclusive)

#### Context7

**Requirements:**

- Optional API key (free tier if not provided)
- Mutually exclusive with RefTools
- Prompt: "Enter Context7 API key (optional, press Enter for free tier)"

**Configuration:**

- MCP package: `@upstash/context7-mcp` (npm)
- Secret: `CONTEXT7_API_KEY` (optional)
- Conflict group: `code-context-providers`

#### RefTools

**Requirements:**

- **Required** API key
- Mutually exclusive with Context7
- Prompt: "Enter RefTools API key (required)"

**Configuration:**

- MCP package: TBD
- Secret: `REFTOOLS_API_KEY` (required)
- Conflict group: `code-context-providers`

**Module System Needs:**

- Support for mutually exclusive groups
- Warn user if trying to install both
- Optional vs required secrets

---

### 3. EXA vs Tavali (Preference-Based Selection)

**Complexity**: Medium (mutually exclusive, different workflows)

**Requirements:**

- Usually only one selected (user preference)
- Different authentication workflows
- Both require API keys
- Should prompt: "Install EXA or Tavali? (Most users choose one)"

#### EXA

**Configuration:**

- MCP package: `mcp-server-exa` (PyPI)
- Secret: `EXA_API_KEY` (required)
- Conflict group: `ai-search-providers`

#### Tavali

**Configuration:**

- MCP package: TBD
- Secret: `TAVALI_API_KEY` (required)
- Conflict group: `ai-search-providers`

**Module System Needs:**

- Support for "usually exclusive" groups (softer than hard conflict)
- Different setup workflows per provider

---

### 4. FireCrawl

**Complexity**: Low (simple API key)

**Requirements:**

- API key required
- Standard MCP server setup

**Configuration:**

- MCP package: `@mendable/firecrawl-mcp` (npm) or similar
- Secret: `FIRECRAWL_API_KEY` (required)

---

### 5. Sequential Thinking

**Complexity**: Very Low (self-contained, no secrets)

**Requirements:**

- No secrets or configuration
- Simple npm package install
- Default lifecycle methods sufficient

**Configuration:**

- MCP package: `@modelcontextprotocol/server-sequential-thinking` (npm)
- No secrets
- No dependencies beyond Node.js

**Module System Needs:**

- This is the "reference simple module"
- Should require minimal code (YAML-only)

---

### 6. Notion (OAuth Flow)

**Complexity**: High (OAuth/SSE authentication)

**Requirements:**

- HTTP-based MCP server
- OAuth authentication flow (not API key)
- Workflow:
  1. User selects Notion in ftk init
  2. System starts local SSE server
  3. Opens browser to Notion authorization page
  4. User authorizes ftk access
  5. Notion redirects to callback URL
  6. ftk receives OAuth token via SSE
  7. Token stored in `.env.mcp.secrets`

**Configuration:**

- MCP package: `@notionhq/mcp-server` (npm)
- Auth method: OAuth/SSE
- No manual API key entry

**Module System Needs:**

- Support for OAuth flows
- SSE server management
- Browser automation (open URL)
- Callback handling
- Token persistence

---

### 7. GitHub MCP

**Complexity**: Medium (token creation options)

**Requirements:**

- Personal access token required
- Two workflows:

**Workflow A (Preferred): GH CLI Automation**

- Check if `gh` CLI is installed
- Run: `gh auth token` or create new token via CLI
- Auto-populate token
- Requires investigation: Can GH CLI create tokens programmatically with specific scopes?

**Workflow B (Fallback): Manual Guide**

- Provide detailed markdown guide in module folder
- Link to: `https://github.com/your-org/ftk/blob/main/modules/github/SETUP.md`
- Guide includes:
  - Step-by-step instructions
  - Screenshots of GitHub token creation UI
  - Required scopes (repo, read:org, etc.)
  - Video walkthrough (optional)
- User follows guide, copies token
- Paste token in ftk prompt

**Configuration:**

- MCP package: `@modelcontextprotocol/server-github` (npm)
- Secret: `GITHUB_PERSONAL_ACCESS_TOKEN` (required)
- Helper: GH CLI integration (if available)

**Module System Needs:**

- Support for CLI-based token creation
- Fallback to documentation links
- Ability to reference module-specific guides

---

### 8. Serena

**Complexity**: High (git-based install, variable args)

**Requirements:**

- Install from git repository (not npm/PyPI)
- Uses UVX with git URL
- Variable number of `--project` arguments (creates Serena projects)
- Flag: `--enable-web-dashboard` (default: false)

**Example Command:**

```bash
uvx --from git+https://github.com/serena-ai/serena serena \
  --context ide-assistant \
  --project project1 \
  --project project2 \
  --enable-web-dashboard false
```

**Configuration:**

- MCP install method: `uvx --from git+<url>`
- Context: `ide-assistant`
- Projects: Prompt user for list of project names
- Dashboard: Prompt (default: false)

**Module System Needs:**

- Support for git-based installations
- Variable-length argument lists
- Boolean flags with defaults
- Multi-value prompts (list of projects)

---

### 9. EXA Researcher (Complex Orchestration)

**Complexity**: Very High (subagent + MCP + conditional logic + cross-module)

**Requirements:**

- API key for EXA MCP server
- Dedicated subagent or slash command
- Orchestrated workflow with multiple steps
- Conditional logic based on installed modules

**Workflow A: With Basic Memory**

1. User invokes EXA Researcher (slash command or subagent)
2. **Pre-research**: Create Basic Memory note with:
   - Task ID
   - Research instructions (verbatim)
   - Status: `in_progress`
3. **Execute**: Call EXA deep research MCP
4. **Poll**: Check status until complete
5. **Cache**: Write raw EXA output to Basic Memory note
6. **Post-process**: Claude analyzes output, adds:
   - Observations section
   - Relations section
   - Tags
7. **Update**: Mark note as `completed`

**Workflow B: Without Basic Memory**

1. User invokes EXA Researcher
2. **Execute**: Call EXA deep research MCP
3. **Poll**: Check status until complete
4. **Cache**: Write to `.cache/exa/<task-id>.md`
5. User can choose to `.gitignore .cache/` or commit results

**Subagent Definition:**

```markdown
---
description: AI-powered deep research with automatic caching
capabilities: ["research", "web-search", "analysis"]
---

# EXA Researcher

Conducts comprehensive deep research using EXA's AI models and automatically caches results.

## Usage

Invoke this agent for complex research tasks requiring multiple sources and synthesis.

## Automatic Caching

- **With Basic Memory**: Results saved to `research/` folder with observations
- **Without Basic Memory**: Results saved to `.cache/exa/` directory
```

**Slash Command:**

```markdown
---
name: /exa-research
description: Deep research with EXA and caching
---

Conducts AI-powered research and caches results automatically.
```

**Configuration:**

- MCP package: `mcp-server-exa` (PyPI)
- Secret: `EXA_API_KEY` (required)
- Subagent: `exa-researcher.md`
- Slash command: `/exa-research`
- Dependencies: Basic Memory (optional)

**Module System Needs:**

- Support for subagents
- Support for slash commands
- Conditional logic based on installed modules
- Cross-module awareness (check if Basic Memory installed)
- Multi-step orchestration
- File system operations (create cache directories)
- Post-processing hooks

---

## System Prompt Embedding Requirements

**Goal**: Based on installed modules, embed relevant information in system prompt so Claude knows when/how to invoke capabilities.

### What to Embed

**For Subagents:**

- Subagent name and description
- Capabilities array
- Usage guidelines
- When to automatically invoke (based on capabilities matching)

**For Slash Commands:**

- Command name and description
- Parameters and usage
- When to suggest to user

**For MCP Tools:**

- Tool schemas and descriptions
- When tools are available
- Usage patterns

### Embedding Strategy

**Minimal Context (Default):**

- List of available subagents with one-line descriptions
- List of slash commands
- MCP tools are always available (don't embed unless special usage)

**Rich Context (On-Demand):**

- When user mentions research → Embed EXA Researcher details
- When user works with Notion → Embed Notion MCP schema
- Context-aware expansion

**Module System Needs:**

- Generate system prompt fragments per module
- Support minimal vs rich embedding modes
- Conditional embedding based on user context
- Ability to update prompt dynamically

---

## Module System Design Requirements

### Core Capabilities

1. **Simple Modules**
   - YAML-only definition
   - Default lifecycle methods
   - Example: Sequential Thinking

2. **API Key Modules**
   - Required or optional secrets
   - Secure storage in `.env.mcp.secrets`
   - Example: EXA, FireCrawl, Context7

3. **OAuth Modules**
   - SSE server for callbacks
   - Browser automation
   - Token persistence
   - Example: Notion

4. **CLI-Assisted Setup**
   - Check for helper CLI tools
   - Automate token creation if possible
   - Fallback to manual guides
   - Example: GitHub MCP

5. **Lifecycle Hooks**
   - Project creation
   - Conditional prompts
   - Example: Basic Memory

6. **Git-Based Installation**
   - Install from git URLs
   - Variable arguments
   - Boolean flags
   - Example: Serena

7. **Complex Orchestration**
   - Multi-step workflows
   - Cross-module dependencies
   - Conditional logic
   - Post-processing
   - Example: EXA Researcher

8. **Mutually Exclusive Groups**
   - Hard conflicts (Context7 vs RefTools)
   - Soft preferences (EXA vs Tavali)
   - Warn users appropriately

9. **Mixed Capabilities**
   - MCP + Hooks (Basic Memory)
   - MCP + Subagent + Slash Command (EXA Researcher)
   - Single module, multiple capabilities

10. **Documentation Support**
    - Module-specific guides (markdown)
    - Screenshots/videos
    - Link to GitHub docs
    - Example: GitHub MCP setup guide

### Property-Based Configuration

All modules should support defining:

- `capabilities: { mcp, hooks, agents, commands }`
- `secrets: [{ key, prompt, optional, oauth? }]`
- `dependencies: [{ command, minVersion }]`
- `conflicts: [{ group, modules }]`
- `mcp: { packageName, packageRegistry, installMethod }`
- `hooks: { definition, install }`
- `agents: [{ file, capabilities }]`
- `commands: [{ file, name }]`

### Lifecycle Method Support

Optional overrides for:

- `precheck(ctx): Promise<PrecheckResult>`
- `configure(ctx): Promise<ConfigureResult>`
- `install(ctx): Promise<InstallResult>`
- `validate(ctx): Promise<ValidationResult>`

### Utility Methods

Base class should provide:

- `commandExists(cmd): Promise<boolean>`
- `getCommandVersion(cmd): Promise<string>`
- `promptForSecrets(): Promise<Record<string, string>>`
- `handleOAuthFlow(secret): Promise<string>`
- `resolveVersion(): Promise<string>`
- `setConfig(key, value): void`
- `getConfig<T>(key): T`
- `isModuleInstalled(moduleId): boolean`
- `getInstalledModules(): string[]`

---

## Deep Research Requirements

To properly implement each module, we need to conduct deep research on:

### Context7

**Research Focus:**

- API authentication methods and endpoints
- Free tier limitations vs paid tiers
- Rate limits and quotas
- MCP server implementation details
- Token format and storage requirements

**Questions:**

- How does the optional API key work?
- What features are restricted on free tier?
- What are the exact npm package and version to use?

### RefTools

**Research Focus:**

- API requirements and authentication
- Setup and onboarding process
- Comparison with Context7 (feature parity)
- MCP server availability and package name

**Questions:**

- Is there an official MCP server?
- What scopes/permissions does the API key need?
- Why would users choose RefTools over Context7?

### EXA

**Research Focus:**

- Deep research API vs standard search API
- Authentication and API key management
- Rate limits and pricing tiers
- MCP server: `mcp-server-exa` package details
- Deep researcher workflow and polling mechanism
- Output format and caching strategies

**Questions:**

- How long do deep research tasks typically take?
- What's the recommended polling interval?
- How should we structure cached research results?

### Tavali

**Research Focus:**

- Product overview and capabilities
- Authentication and setup
- Differences from EXA
- MCP server availability
- When to recommend Tavali vs EXA

**Questions:**

- Is there an official MCP server?
- What are the key differentiators vs EXA?
- What's the pricing model?

### FireCrawl

**Research Focus:**

- API authentication
- MCP server package name and version
- Scraping capabilities and limitations
- Rate limits
- Use cases (when to use FireCrawl vs EXA)

**Questions:**

- What's the official npm package for the MCP server?
- Are there different tiers or quotas?

### Sequential Thinking

**Research Focus:**

- Official MCP server package and version
- Capabilities and when Claude should invoke
- System requirements (Node.js version)
- Configuration options (if any)

**Questions:**

- Are there configuration flags we should expose?
- What's the difference between sequential thinking and default Claude reasoning?

### Notion

**Research Focus:**

- OAuth flow specifics (authorization URL, scopes, callback)
- MCP server implementation: `@notionhq/mcp-server`
- Required OAuth scopes for common operations
- SSE callback mechanism
- Token refresh and expiration handling

**Questions:**

- What's the OAuth callback URL structure?
- How do we start the SSE server?
- What scopes should we request by default?
- Does the token expire? How to handle refresh?

### GitHub MCP

**Research Focus:**

- Official MCP server package and version
- Required personal access token scopes
- GH CLI capabilities for token creation
- Token management best practices
- Alternative: GitHub App authentication

**Questions:**

- Can `gh` CLI create tokens programmatically?
- What are the minimum required scopes?
- Is GitHub App auth supported by the MCP server?
- How to guide users on token creation with screenshots?

### Serena

**Research Focus:**

- Git repository URL and installation method
- UVX installation from git URLs
- Context types available (ide-assistant vs others)
- Project argument structure (can you have multiple?)
- Dashboard feature and why to disable by default
- CLI flags and options

**Questions:**

- What's the official git repository URL?
- How many projects can you configure?
- What does the web dashboard do?
- Are there other context types besides ide-assistant?

### EXA Researcher Orchestration

**Research Focus:**

- EXA Deep Research API workflow
- Task lifecycle (start → poll → complete)
- Recommended polling intervals
- Error handling and retries
- Output format and structure
- Best practices for caching large research results

**Questions:**

- How to detect when research is complete?
- What's in the research output structure?
- How to gracefully handle timeouts or failures?
- Should we implement exponential backoff for polling?

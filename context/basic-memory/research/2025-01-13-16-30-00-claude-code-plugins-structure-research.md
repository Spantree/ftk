---
permalink: research/2025-01-13t16-30-claude-code-plugins-structure-research
---

---

title: 2025-01-13 16-30: Claude Code Plugins Structure Research
type: research
permalink: research/2025-01-13t16-30-claude-code-plugins-structure-research
tool: exa_deep_researcher
model: exa-research-pro
task_id: "01k9zapyc23een82xf6hmcr6w6"
date: 2025-01-13
query_type: deep_research
status: completed
instructions: |
Research Claude Code plugins: their structure, configuration format, and capabilities. I need comprehensive information to understand how to structure modules that could be MCP servers, subagents, hooks, commands, or combinations thereof.

Key areas to investigate:

1. What are Claude Code plugins? How do they work?
2. Plugin structure and configuration format (JSON schema, file structure, etc.)
3. How plugins relate to/differ from MCP servers
4. Can plugins incorporate subagents? If so, how?
5. Can plugins include custom hooks or slash commands?
6. Installation and distribution model for plugins
7. Examples of real plugins and their configurations
8. Plugin lifecycle and registration process
9. Comparison: plugins vs MCP servers vs subagents vs hooks
10. Best practices for structuring complex plugins with multiple capabilities

Focus on official Claude Code documentation, announcements, and examples. Include specific configuration examples and code snippets where available.
tags:

- exa-research
- research
- claude-code
- plugins
- architecture
- ftk-redesign

---

# Claude Code Plugins Structure Research

## Research Report

### Introduction

Claude Code plugins are a versatile extension mechanism introduced by Anthropic to customize and extend the behavior of the Claude Code development environment. They allow developers to package collections of slash commands, specialized subagents, Model Context Protocol (MCP) servers, and event hooks into reusable modules that can be shared via marketplaces.

### 1. What Are Claude Code Plugins

Claude Code plugins are lightweight packages that bundle one or more extension points—slash commands, subagents, MCP servers, and hooks—into a single unit that can be installed via the `/plugin` CLI command. When enabled, plugins toggle on their components to augment Claude Code's toolset; disabling them removes associated context to reduce system prompt complexity.

### 2. Plugin Structure and Configuration

**File Structure:**

- `plugin.json`: manifest declaring metadata and component paths
- `commands/`: Markdown files defining custom slash commands
- `agents/`: Markdown files describing subagents
- `skills/`: directories with SKILL.md for model-invoked agent skills
- `hooks/hooks.json`: JSON hook definitions
- `.mcp.json`: MCP server configurations

**Manifest (plugin.json):**

```json
{
  "name": "plugin-name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "commands": ["./custom/commands/special.md"],
  "agents": "./custom/agents/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json"
}
```

**Required field**: `name` (kebab-case, no spaces)

**Schema Highlights:**

- Metadata: version, description, author, homepage, repository, license, keywords
- Component Path Fields: commands, agents, skills, hooks, mcpServers
- Environment Variables: Use `${CLAUDE_PLUGIN_ROOT}` to reference plugin directory

### 3. Relationship to MCP Servers

MCP servers enable Claude Code to connect to external services via the Model Context Protocol. Plugins can bundle MCP servers in `.mcp.json` or inline in `plugin.json`, whereas standalone MCP servers are configured per user. Plugin MCP servers start automatically with the plugin, integrating seamlessly into Claude's toolkit without requiring separate user configuration.

### 4. Incorporating Subagents

Subagents are specialized AI agents within Claude Code. Plugins provide subagents as Markdown files under `agents/` with frontmatter specifying a description and capabilities:

```markdown
---
description: Code review agent
capabilities: ["review", "lint"]
---

# CodeReviewer

...Detailed usage...
```

Claude can invoke these subagents manually via `/agents` or automatically when task context matches capabilities.

### 5. Custom Hooks and Slash Commands

**Slash Commands:** Defined as Markdown files under `commands/`, they appear in Claude Code's command palette. They support metadata in frontmatter and rich invocation patterns.

**Hooks:** Configured in `hooks/hooks.json` with event matchers (e.g., `PostToolUse`) and actions (`command`, `validation`, `notification`):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format.sh"
          }
        ]
      }
    ]
  }
}
```

Available events include `PreToolUse`, `UserPromptSubmit`, `SessionStart`, and more.

### 6. Installation and Distribution Model

Plugins are distributed via plugin marketplaces—JSON catalogs hosted in git repos or URLs with `.claude-plugin/marketplace.json`. Users add marketplaces (`/plugin marketplace add owner/repo`), then install plugins (`/plugin install name@marketplace`). Marketplaces support GitHub, other git, URLs, and local paths. Teams can preconfigure `extraKnownMarketplaces` and `enabledPlugins` in `.claude/settings.json` for automated setup.

### 7. Examples of Real Plugins

Anthropic's `anthropics/claude-code` repository includes:

- PR Review Plugin: Custom slash commands for automated reviews
- Security Guidance Plugin: Hooks that invoke security scripts post-commit
- Database Connector: MCP server in `.mcp.json` with `command`, `args`, and `env`

Community examples:

- Dan Ávila's marketplace at `aitmpl.com/plugins`
- Seth Hobson's curated subagents at `github.com/wshobson/agents`

### 8. Plugin Lifecycle

1. **Discovery**: Claude Code discovers plugins via configured marketplaces
2. **Installation**: `/plugin install` clones or fetches plugin files
3. **Enable**: Components are registered in session context
4. **Invoke**: Slash commands, subagents, MCP servers, hooks become available
5. **Disable**: Plugin context is removed
6. **Update**: Version changes in marketplace or repo trigger `/plugin update`

**CLI commands:**

```bash
/plugin marketplace add owner/repo
/plugin marketplace list
/plugin install plugin-name@marketplace
/plugin update plugin-name
/plugin remove plugin-name
```

### 9. Comparison Matrix

- **Plugins**: Bundles combining multiple component types for modular packaging
- **MCP Servers**: Individual servers providing external tool connectivity
- **Subagents**: Specialized AI agents invoked by Claude
- **Hooks**: Event-driven scripts or validations in workflow

Plugins can encapsulate any combination for cohesive distribution.

### 10. Best Practices

- Organize component directories clearly (`commands/`, `agents/`, etc.)
- Use semantic versioning and maintain `CHANGELOG.md`
- Reference plugin root via `${CLAUDE_PLUGIN_ROOT}`
- Minimize large context additions; scope hooks and agents narrowly
- Provide examples and documentation in `README.md`
- Leverage marketplaces for team-wide consistency

## observations

- [architecture] Plugins are composite bundles combining commands, agents, MCP servers, and hooks in a single distributable package #plugin-architecture #composability
- [design-decision] plugin.json manifest serves as central configuration with component path pointers, enabling flexible directory structures #configuration-design
- [integration] MCP servers can be embedded in plugins or configured standalone—plugins auto-start their MCP servers without requiring separate user configuration #mcp-integration
- [fact] Hooks use JSON configuration with event matchers (PreToolUse, PostToolUse, UserPromptSubmit, SessionStart) and action types (command, validation, notification) #hooks #event-driven
- [fact] Subagents defined as Markdown files with frontmatter specifying description and capabilities array for automatic context matching #subagents #markdown-config
- [fact] Slash commands are Markdown files in commands/ directory with frontmatter metadata #slash-commands
- [business-insight] Marketplace distribution model (JSON catalogs in git repos) enables team-wide standardization and version control of development workflows #distribution #team-workflows
- [limitation] Context overhead when multiple plugins enabled—best practice is to scope components narrowly to minimize system prompt complexity #performance #context-management
- [architecture] Plugin lifecycle follows discovery → install → enable → invoke pattern with CLI commands for management #lifecycle
- [use-case] Plugins solve "bundle multiple extension points into one distributable unit" problem—ideal for tool suites, workflow templates, and team standards #use-cases

## relations

- relates-to: [[fluent-toolkit-project-overview]]
- informs: [[ftk-module-system-redesign]]
- depends-on: [[model-context-protocol]]
- context: ftk module system redesign

### 11. Version Pinning in Plugins

**Plugin-Level Versioning:**

- Each plugin has a `version` field in `plugin.json` (e.g., `"version": "1.2.3"`)
- Uses semantic versioning convention

**Marketplace Version Control:**

```json
{
  "id": "org-standard.secure-review",
  "version": "1.2.3",
  "source": {
    "type": "git",
    "url": "https://github.com/your-org/cc-secure-review-plugin",
    "ref": "v1.2.3"
  }
}
```

**Installation with Versions:**

- Install specific version: `/plugin install plugin-name@1.2.3@marketplace`
- Enforce versions org-wide in `.claude/settings.json`:

```json
{
  "enabledPlugins": [
    "org-standard.secure-review@1.2.3",
    "org-standard.repo-assistant@0.9.5"
  ]
}
```

**Key Differences from ftk's Approach:**

- **Plugins**: Version pinning at plugin bundle level (entire plugin = one version)
- **ftk**: Version pinning at MCP server package level (`mcp.lock.json` pins npm/PyPI packages)
- **Plugins**: Git refs for source control
- **ftk**: Package registry resolution (npm/PyPI) with lock file

**Update Strategy:**

- Marketplace changes via PRs with release notes
- Staged rollouts (staging marketplace first)
- Explicit rollback plans required

### 12. System Prompt Embedding and Context Management

**Context Injection Mechanism:**

- When plugins are **enabled**, their components are registered in session context
- Plugin components (commands, agents, MCP servers, hooks) become available in Claude's system prompt
- When plugins are **disabled**, their context is removed to reduce system prompt complexity

**Context Overhead Concerns:**

- Each enabled plugin adds to system prompt size
- Multiple plugins can cause "context overhead"
- **Best practice**: Scope components narrowly to minimize system prompt complexity
- Toggle plugins on/off as needed for specific tasks

**What Gets Embedded:**

- **Slash commands**: Command definitions and usage patterns
- **Subagents**: Agent descriptions and capabilities metadata
- **MCP servers**: Tool definitions and schemas
- **Hooks**: Event matcher configurations (but scripts don't run in prompt - they execute externally)

**Context Control:**

- Plugins designed to be toggled on/off
- Enable when needed for specific capabilities
- Disable to reduce context and improve performance
- No granular control over individual component embedding (all-or-nothing per plugin)

**Team Standardization:**

- `.claude/settings.json` can enforce required plugins
- Teams can mandate context policies via plugin requirements
- CI/CD can validate plugin configurations

# fluent-toolkit

MCP server setup toolkit for Claude Code. Helps developers quickly configure and install Model Context Protocol servers.

## Project Overview

This is a Deno-based CLI tool that:

- Provides an interactive wizard for selecting and configuring MCP servers
- Manages secrets securely via `.env.mcp.secrets`
- Generates `.mcp.json` configuration for Claude Code
- Updates `CLAUDE.md` with server-specific usage instructions
- Creates optional context directories for AI assistant resources

## Development Standards

### Commit Message Convention (STRICTLY ENFORCED)

All commits MUST follow Conventional Commits with 50/72 rule:

**Format:**

```
type(scope): subject line max 50 chars

Optional body wrapped at 72 characters. Explain what and why,
not how. Use imperative mood ("add" not "added").

Optional footer for breaking changes or issue references.
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without changing behavior
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies, tooling
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Scopes:**

- `init`: Init command
- `registry`: Server registry
- `config`: Configuration management
- `secrets`: Secrets management
- `ui`: User interface/prompts
- `cli`: CLI framework
- `formula`: Homebrew formula
- `release`: Release automation

**Examples:**

```
feat(registry): add modular server architecture

Refactored from JSON-based registry to TypeScript modules.
Each server now has its own directory with index.ts and
claude.md files. Supports lifecycle methods for interactive
configuration.

BREAKING CHANGE: servers.json no longer used
```

```
docs: reorganize documentation into docs/ folder

Moved all markdown files to docs/ directory for cleaner
project structure. Updated internal links and created
documentation index.
```

```
chore(deps): update Deno dependencies to latest
```

### Code Style

- **TypeScript strict mode**: All code must pass strict type checking
- **No unused variables**: Prefix with `_` if intentionally unused
- **Error handling**: Always use `error instanceof Error` checks
- **File operations**: Use Read tool before Write/Edit operations

### Documentation

- Keep root directory clean - all docs in `docs/`
- Update `docs/README.md` when adding new documentation
- Use relative links within docs/ directory
- Archive historical documents in `docs/archive/`

### Basic Memory Notes

All project documentation should be stored as Basic Memory notes, not regular markdown files:

**Folder Structure**:

- `features/` - Feature documentation (not prefixed with issue numbers, may span multiple issues)
- `plans/` - Task management and implementation plans (see Basic Memory Conventions below)
- `guides/` - How-to documentation and usage instructions
- `technologies/` - Technical documentation and architecture
- `research/` - Cached research results
- `meetings/` - Meeting notes

**Basic Memory Protocol**:

The `memory://` URI scheme refers to Basic Memory notes. This can appear:

- In CLAUDE.md instructions: `memory://guides/plan-notes-for-complex-tasks`
- In user prompts: `@memory://notes/mynote` or `Look at memory://plans/018-add-feature`

**How to load `memory://` references:**

- Use `read_note(identifier: "guides/plan-notes-for-complex-tasks")` for single notes
- Use `build_context(url: "memory://guides/plan-notes-for-complex-tasks")` for notes with related context
- Strip the `memory://` prefix when using `read_note` (it expects just `"folder/note"`)

**Plan Note Naming** (see Basic Memory Conventions section for details):

- Start without issue prefix: `"Add Feature Name"`
- Add zero-padded prefix when assigned: `"#018: Add Feature"` (GitHub) or `"PRJ-042: Add Feature"` (Jira)
- Filenames auto-generated from kebab-cased title
- Other note types (features, guides, etc.) never use issue prefixes

## Architecture

### Modular Server Registry

Each MCP server is a self-contained module in `registry/mcp-servers/`:

```
registry/mcp-servers/sequentialthinking/
├── index.ts      # Server implementation with lifecycle methods
└── claude.md     # CLAUDE.md fragment for this server
```

### Lifecycle Methods

Servers implement:

- `precheck(ctx)` - Verify dependencies
- `configure(ctx)` - Collect secrets/config
- `install(ctx)` - Generate MCP config
- `validate(ctx)` - Optional post-install validation

### Context Directory (Optional)

The context directory feature allows MCP servers to store data:

- Default name: `context/` (user-configurable)
- Gitignored by default
- Servers can opt-in to git exposure via `exposeContextToGit: true`
- See `docs/context-directory.md` for details

### Basic Memory Conventions

**Quick Reference** (for plan notes only):

- **Titles**: `"Add Feature"` (no issue) or `"#018: Add Feature"` (GitHub) or `"PRJ-042: Add Feature"` (Jira)
- **Issue Numbers**: Always zero-padded in titles/filenames (`#018`, `PRJ-042`)
- **Filenames**: Auto-generated from kebab-cased title (`018-add-feature.md`, `prj-042-add-feature.md`)
- **URLs**: Use tracker's actual format (NOT zero-padded: `/issues/18`, `/browse/PRJ-42`)

**Frontmatter Template**:

```yaml
---
title: "#018: Add Feature Name" # Zero-padded
type: plan
url: https://github.com/myorg/myrepo/issues/18 # NOT zero-padded
permalink: plans/018-add-feature-name # Auto-generated
tags: [issue-018, feature-area] # Zero-padded tag
---
```

**Essential Rules**:

- Format all notes with Prettier after creation/editing
- Use status emojis: 📌 BACKLOG, ⏳ IN PROGRESS, ✅ COMPLETED
- Update status as work progresses
- Include observations and design decisions

**Working with Plan Notes - Required Reading:**

Before creating or updating any plan note, you MUST:

1. Load `memory://guides/plan-notes-for-complex-tasks`
2. Follow the conventions exactly as documented
3. Use Sequential MCP for complex analysis (see guide for workflow)

Additional reference: `memory://guides/basic-memory-note-conventions`

## Distribution

This project uses Homebrew for distribution:

- Formula lives in `Formula/fluent-toolkit.rb`
- No separate homebrew-tap repository needed
- Binaries compiled via `deno task compile:all`
- See `docs/quickstart.md` for release workflow

## Key Files

- `src/main.ts` - CLI entry point
- `src/commands/init.ts` - Main initialization command
- `registry/index.ts` - Server registry discovery
- `Formula/fluent-toolkit.rb` - Homebrew formula
- `scripts/release.sh` - Release automation

## Available Commands

- `ftk init` - Interactive MCP server setup with automatic Claude Code installation/upgrade
- `ftk --version` - Show version
- `ftk --help` - Show help

### Claude Code Installation Checking

The `ftk init` command includes comprehensive Claude Code installation checking:

**Scenarios Handled:**

1. **Not Installed**: Offers automatic installation with command preview
   - Uses official npm method: `npm install -g @anthropic-ai/claude-code`
   - Alternative methods available (brew, winget)
   - Requires user confirmation before executing
   - Re-validates installation after completion

2. **Outdated Version**: Offers automatic upgrade with command preview
   - Auto-detects installation method (npm, brew, etc.)
   - Shows appropriate upgrade command
   - Displays changelog with changes between versions
   - Requires user confirmation before executing
   - Allows continuing with old version or cancelling

3. **Upgrade Available**: Optionally offers upgrade to latest version
   - Checks package manager for newer versions
   - Shows available version and changelog
   - Displays what's new between current and latest
   - Non-blocking - setup continues regardless

**Installation Method Detection:**

- Automatically detects if Claude Code was installed via npm or brew
- Uses npm commands for npm installations
- Uses brew commands for Homebrew installations
- Defaults to npm (official method) for new installations

**Flags:**

- `--skip-checks` - Skip Claude Code version checking entirely
- `--no-prompt` - Show instructions but don't offer automatic install/upgrade

## Development Workflow

### Feature Branch Pattern

All features MUST be developed in dedicated feature branches following this naming convention:

**Pattern**: `feat/{issue-number}-{short-description}`

**Examples**:

- `feat/001-add-claude-code-installation-and-version-checks`
- `feat/002-add-notion-mcp-server-support`
- `feat/006-pin-mcp-server-versions`

**Workflow**:

1. Create branch from `main`: `git checkout -b feat/XXX-description`
2. Make changes and commit following commit message convention
3. Push branch: `git push -u origin feat/XXX-description`
4. Open PR with detailed description and feedback areas
5. Address review feedback
6. Merge via squash commit to maintain clean history

### Local Development

**Using Justfile (Recommended):**

```bash
just dev init              # Run ftk in development mode
just check                 # Type check
just validate              # Type check + lint + format check
just quick-test            # Validate + compile + unit tests
just vm-setup              # Setup Tart VM for integration testing
```

**Using Deno directly:**

1. **Local testing**: `deno task dev init`
2. **Type checking**: `deno check src/main.ts`
3. **Formatting**: `deno fmt`
4. **Linting**: `deno lint`
5. **Compile**: `deno task compile` or `deno task compile:all`
6. **Check CI status**: `gh run list` or `gh run view`

**See [docs/justfile.md](docs/justfile.md) for complete command reference.**

## Release Workflow

1. Run `./scripts/release.sh <version>`
2. Create GitHub release and upload binaries
3. Update `Formula/fluent-toolkit.rb` with checksums
4. Commit and push formula changes

See `docs/quickstart.md` for detailed instructions.

## Resources

- **Documentation**: See `docs/README.md` for complete documentation index
- **Installation**: `docs/installation.md`
- **Distribution**: `docs/quickstart.md`
- **Contributing**: `docs/development.md`

---
title: Plan Notes for Complex Tasks
type: guide
permalink: guides/plan-notes-for-complex-tasks
tags:
  - plans
  - task-management
  - sequential-thinking
  - workflow
  - documentation
---

# Plan Notes for Complex Tasks

Guide for creating and maintaining plan notes for complex, multi-step tasks in fluent-toolkit.

## What Are Plan Notes?

Plan notes are **persistent task definitions** with checklists that track complex work over time. They serve as:

- **Single source of truth** for task status and approach
- **Retrievable context** across Claude Code sessions
- **Reference documentation** that survives conversation compaction
- **Progress tracker** with phase-based checklists

## When to Use Plan Notes

### DO Create Plan Notes For:

- ✅ **Complex implementations** requiring 3+ phases or 10+ subtasks
- ✅ **Multi-session work** that spans multiple days or conversations
- ✅ **Issues tracked externally** (GitHub, Jira, etc.)
- ✅ **Tasks needing persistent context** that would be lost to compaction
- ✅ **Collaborative work** where others need to understand the plan

### DON'T Create Plan Notes For:

- ❌ Simple, single-step tasks
- ❌ Quick fixes or trivial changes
- ❌ Exploratory research (use research/ folder instead)
- ❌ General documentation (use guides/ or features/ instead)

## Integration with Sequential Thinking

When using the Sequential MCP for complex problem-solving:

1. **Start Sequential thinking** to analyze the problem
2. **Create plan note** as you identify implementation phases
3. **Update plan progressively** during Sequential analysis
4. **Reference plan** in later sessions to maintain context

### Sequential → Plan Workflow

```typescript
// During Sequential analysis:
// 1. Break down problem into phases
// 2. Identify tasks and dependencies
// 3. Write plan note with findings
// 4. Continue implementation with plan as reference

// Example flow:
1. User requests: "Add scoped environment variables"
2. Use Sequential to analyze approaches
3. Create plan note: "Add Scoped Environment Variable Management"
4. Sequential updates plan as it identifies tasks
5. Plan becomes persistent reference for implementation
```

### Benefits of Sequential + Plans

- **Context preservation** - Analysis survives conversation compaction
- **Incremental refinement** - Update plan as understanding deepens
- **Session continuity** - Pick up where you left off days later
- **Audit trail** - See how design evolved over time

## Plan Note Structure

### Frontmatter

**Without External Issue** (Draft):

```yaml
---
title: "Add Feature Name"
type: plan
status: Draft # Draft | Open | Closed
tags:
  - feature-area
  - technology-stack
---
```

**With GitHub Issue** (#018):

```yaml
---
title: "#018: Add Feature Name" # Zero-padded in title
type: plan
status: Open # Synced with GitHub issue state
issue: 18 # GitHub issue number
url: https://github.com/myorg/myrepo/issues/18 # NOT zero-padded
tracker: github # Issue tracker type
synced_at: 2025-11-17T20:30:00Z # Last sync timestamp
permalink: plans/018-add-feature-name # Auto-generated
tags:
  - issue-018 # Zero-padded tag
  - feature-area
---
```

**With Jira Issue** (PRJ-042):

```yaml
---
title: "PRJ-042: Add Feature Name" # Zero-padded in title
type: plan
status: Open # Synced with Jira issue status
issue: PRJ-42 # Jira issue key
url: https://myorg.atlassian.net/browse/PRJ-42 # Jira's actual format
tracker: jira # Issue tracker type
synced_at: 2025-11-17T20:30:00Z # Last sync timestamp
permalink: plans/prj-042-add-feature-name # Auto-generated
tags:
  - issue-prj-042
  - feature-area
---
```

**Important**: URLs use the issue tracker's actual format (not zero-padded), while titles and filenames use zero-padding for proper sorting.

### Required Sections

```markdown
# Plan Title

**Status**: 📌 BACKLOG | ⏳ IN PROGRESS | ✅ COMPLETED

## Problem Statement

What problem are we solving? Why does it matter?

## Proposed Solution

High-level approach and key design decisions.

## Implementation Plan

### 📌 Phase 1: Core Infrastructure

#### ⏳ Task 1.1: First Subtask

- [ ] Specific action item
- [ ] Another action item

**Files**:

- `path/to/file.ts` (new/modify)

### 📌 Phase 2: Integration

[Continue with additional phases...]

## Success Criteria

- [ ] Measurable outcome 1
- [ ] Measurable outcome 2

## Observations

Key insights, design decisions, tradeoffs made.

## References

Links to relevant documentation, RFCs, discussions.
```

## Issue Tracker Integration

Plan notes can be synced with external issue trackers (GitHub Issues or Jira) using their respective MCP servers.

**Note**: The workflows below use natural language requests to Claude, which uses GitHub/Jira MCP tools and Basic Memory tools to perform the operations. These could be implemented as slash commands in the future (e.g., `/publish-plan`, `/import-issue`, `/sync-plan`).

### Status Field

All plan notes should include a `status` field in frontmatter:

- **Draft**: Local-only plan, not yet published to issue tracker
- **Open**: Published to issue tracker and actively tracked
- **Closed**: Completed and closed in issue tracker

**Status transitions**:

```
Draft → Open (when published to issue tracker)
Open → Closed (when issue closed remotely and synced)
```

### Publishing Workflow (Local → Remote)

When a plan is ready to share with the team:

```bash
# 1. Create plan locally with status: Draft
User: "Create a plan note for adding feature X"
# Claude creates plan with status: Draft

# 2. Work on plan, refine approach

# 3. When ready, publish to GitHub
User: "Publish the feature X plan to GitHub"
# Claude will:
# - Read the plan note
# - Create GitHub issue with plan title and body
# - Update frontmatter with issue number, URL, tracker
# - Change status from Draft to Open
# - Optionally rename file to include issue number
```

**Implementation using GitHub MCP**:

```typescript
// Read local plan
const plan = read_note("plans/add-feature-name");

// Create GitHub issue
const issue = mcp__github__create_issue({
  owner: "myorg",
  repo: "myrepo",
  title: plan.title,
  body: plan.content,
  labels: plan.tags,
});

// Update plan frontmatter
edit_note({
  identifier: "plans/add-feature-name",
  operation: "find_replace",
  find_text: "status: Draft",
  content: `status: Open
issue: ${issue.number}
url: ${issue.url}
tracker: github
synced_at: ${new Date().toISOString()}`,
});

// Optionally rename with issue number
move_note({
  identifier: "plans/add-feature-name",
  destination_path: `plans/${issue.number}-add-feature-name.md`,
});
```

### Import Workflow (Remote → Local)

Pull existing issues into local plans:

```bash
# Import GitHub issue #456
User: "Import GitHub issue #456 into a plan note"
# or
User: "Import https://github.com/myorg/myrepo/issues/456 as a plan"

# Claude will:
# - Fetch issue details from GitHub
# - Map issue state to plan status (open → Open, closed → Closed)
# - Create plan note with proper frontmatter
# - Include issue body as plan content
```

**Implementation using GitHub MCP**:

```typescript
// Fetch issue from GitHub
const issue = mcp__github__get_issue({
  owner: "myorg",
  repo: "myrepo",
  issue_number: 456,
});

// Map GitHub state to plan status
const status = issue.state === "open" ? "Open" : "Closed";

// Create plan note
write_note({
  title: `#${String(issue.number).padStart(3, "0")}: ${issue.title}`,
  folder: "plans",
  type: "plan",
  tags: ["imported", ...issue.labels.map((l) => l.name)],
  content: `---
title: "#${String(issue.number).padStart(3, "0")}: ${issue.title}"
type: plan
status: ${status}
issue: ${issue.number}
url: ${issue.html_url}
tracker: github
synced_at: ${new Date().toISOString()}
---

${issue.body}

## GitHub Comments
${issue.comments_data?.map((c) => `### ${c.user.login} - ${c.created_at}\n${c.body}`).join("\n\n")}
`,
});
```

### Sync Workflow (Bidirectional)

Keep local plans in sync with remote issues:

```bash
# Sync specific plan from GitHub
User: "Sync plan #456 with GitHub"

# Claude will:
# - Fetch latest issue state from GitHub
# - Update local status if changed
# - Merge comments/updates
# - Handle conflicts if both changed
```

**Sync strategy**:

- **Remote wins for status**: Issue state overrides local
- **Merge tags**: Union of local tags and remote labels
- **Content conflicts**: Show diff and prompt user

**Implementation**:

```typescript
// Fetch remote issue
const remote = mcp__github__get_issue({...});
const local = read_note("plans/456-feature-name");

// Check for status changes
if (remote.state !== local.frontmatter.status.toLowerCase()) {
  // Remote status wins
  edit_note({
    operation: "find_replace",
    find_text: `status: ${local.frontmatter.status}`,
    content: `status: ${remote.state === 'open' ? 'Open' : 'Closed'}`
  });
}

// Check for content changes
if (local_modified_since_sync && remote_modified_since_sync) {
  // Conflict! Show diff to user
  console.log("Conflict detected:");
  console.log("Local changes:", local.content);
  console.log("Remote changes:", remote.body);
  console.log("Choose: [L]ocal, [R]emote, [M]erge manually?");
}

// Update sync timestamp
edit_note({
  find_text: `synced_at: ${local.frontmatter.synced_at}`,
  content: `synced_at: ${new Date().toISOString()}`
});
```

### Status Check

Check sync status of all plans:

```bash
# Show which plans are out of sync
User: "Check which plan notes are out of sync with GitHub"

# Claude will output:
# ✅ #018: Add Feature - in sync (last synced: 2 hours ago)
# ⚠️  #042: Fix Bug - out of sync (remote closed, local still open)
# ❌ #099: New Feature - conflict (both changed since last sync)
```

### Jira Integration

Same workflow works with Jira MCP:

```typescript
// Jira uses different field names but same concept
mcp__jira__create_issue({
  project: "PRJ",
  summary: plan.title,
  description: plan.content,
  issuetype: "Task",
});

// Jira keys are alphanumeric (PRJ-42)
// Store in frontmatter as: issue: "PRJ-42"
```

### Best Practices for Issue Sync

**DO**:

- ✅ Start as Draft, publish when ready
- ✅ Sync with remote regularly to stay current
- ✅ Let remote status win (source of truth)
- ✅ Add GitHub/Jira labels/tags locally for discoverability
- ✅ Include issue URL in plan for quick access

**DON'T**:

- ❌ Manually edit issue number/URL fields
- ❌ Change status without syncing
- ❌ Forget to sync before continuing work
- ❌ Publish incomplete Drafts

## Naming Conventions

### Titles

**Local Plan (No External Issue)**:

```yaml
title: "Add Scoped Environment Variable Management"
```

Filename: `add-scoped-environment-variable-management.md`

**Mirrored to GitHub**:

```yaml
title: "#018: Add Scoped Environment Variable Management"
```

Filename: `18-add-scoped-environment-variable-management.md`

**Mirrored to Jira**:

```yaml
title: "PRJ-042: Add Custom Plugin System"
```

Filename: `prj-042-add-custom-plugin-system.md`

### Key Rules

- ❌ DON'T use `issue-N-` prefix (old convention)
- ✅ DO use `#NNN:` for GitHub (zero-padded to 3 digits: `#001`, `#018`, `#123`)
- ✅ DO use `PROJECT-NNN:` for Jira (also zero-padded: `PRJ-042`)
- ✅ DO update title/filename when issue is created
- ✅ DO let Basic Memory auto-generate filenames and permalinks

**Zero-padding rationale**: Ensures alphabetical sorting matches numeric order in file listings

### Auto-Kebab-Casing

When `BASIC_MEMORY_KEBAB_FILENAMES=true` (default for FTK-managed projects):

- Basic Memory automatically converts titles to kebab-case filenames
- Title: `"Add Feature Name"` → Filename: `add-feature-name.md`
- Title: `"#018: Add Feature"` → Filename: `018-add-feature.md`
- Permalink auto-generated as: `{folder}/{kebab-cased-title}`
- **Don't manually specify filename or permalink** - both are auto-generated from title

## Workflow

### Creating a New Plan

#### Option 1: Manual Creation

```bash
# User requests complex task
User: "Add scoped environment variables to FTK"

# Create plan note
write_note(
  project: "fluent-toolkit",
  folder: "plans",
  title: "Add Scoped Environment Variable Management",
  type: "plan",
  tags: ["environment-variables", "security", "mcp"],
  content: "..."
)
```

#### Option 2: Sequential-Driven Creation

```bash
# Use Sequential to analyze problem
sequential_thinking(
  thought: "This is complex - let me break it down..."
  # ... multiple thoughts analyzing the problem ...
)

# Sequential identifies phases and creates plan
write_note(
  project: "fluent-toolkit",
  folder: "plans",
  title: "Add Scoped Environment Variable Management",
  content: "# Plan based on Sequential analysis..."
)

# Continue implementation with plan as reference
```

### Updating During Work

```typescript
// As you work, update the plan
edit_note(
  identifier: "plans/add-scoped-environment-variable-management",
  operation: "find_replace",
  find_text: "- [ ] Create env provider",
  content: "- [x] Create env provider"
)

// Mark phases as in progress or completed
edit_note(
  operation: "find_replace",
  find_text: "### 📌 Phase 1:",
  content: "### ✅ Phase 1:"
)
```

### When Issue is Created

```typescript
// User creates GitHub issue #18
// Update plan to reflect this

// 1. Update title
edit_note(
  identifier: "plans/add-scoped-environment-variable-management",
  operation: "find_replace",
  find_text: 'title: "Add Scoped Environment Variable Management"',
  content: 'title: "#018: Add Scoped Environment Variable Management"'
)

// 2. Rename file
move_note(
  identifier: "plans/add-scoped-environment-variable-management",
  destination_path: "plans/18-add-scoped-environment-variable-management.md"
)

// 3. Update issue link
edit_note(
  operation: "find_replace",
  find_text: '**Issue**: TBD',
  content: '**Issue**: https://github.com/myorg/ftk/issues/18'
)
```

## Status Tracking

### Status Emojis

- 📌 **BACKLOG** - Not started, planned for future
- ⏳ **IN PROGRESS** - Currently being worked on
- ✅ **COMPLETED** - Finished and verified

### Phase Tracking

```markdown
### 📌 Phase 1: Not Started

### ⏳ Phase 2: In Progress

### ✅ Phase 3: Completed
```

### Task Tracking

```markdown
- [ ] Not started
- [x] Completed
```

## Best Practices

### DO

- ✅ **Create early** - Start plan as soon as complexity is evident
- ✅ **Update frequently** - Mark tasks complete as you go
- ✅ **Be specific** - "Create FileEnvProvider class" not "Add file stuff"
- ✅ **Include file paths** - Shows exactly what changes
- ✅ **Document decisions** - Capture "why" in Observations
- ✅ **Reference source** - Link to RFCs, docs, discussions
- ✅ **Format with Prettier** - Keep it readable
- ✅ **Use Sequential** - Let it help structure complex plans

### DON'T

- ❌ **Create for simple tasks** - Overhead not worth it
- ❌ **Leave stale** - Update status or mark as obsolete
- ❌ **Be vague** - "Fix the thing" isn't helpful later
- ❌ **Skip observations** - Context loss is painful
- ❌ **Manual permalinks** - Let Basic Memory auto-generate
- ❌ **Forget to update** - Stale plans are worse than no plans

## Retrieving Plans Across Sessions

### Starting New Session

```typescript
// Days/weeks later, new Claude Code session
User: "Continue work on environment variable scoping"

// Search for relevant plan
search_notes(
  project: "fluent-toolkit",
  query: "environment variable scoped"
)

// Read the plan
read_note(
  identifier: "plans/18-add-scoped-environment-variable-management"
)

// Now you have full context:
// - What was decided
// - What's been done
// - What's next
// - Why certain approaches were chosen
```

### After Conversation Compaction

Plan notes survive compaction because they're stored externally in Basic Memory. Even if the conversation history is truncated, the plan remains fully accessible.

## Examples

### Example 1: Local Plan (Draft)

```yaml
---
title: "Add MCP Tool Filtering Proxy"
type: plan
status: Draft
tags: ["mcp", "security", "proxy"]
---

# Add MCP Tool Filtering Proxy

**Status**: 📌 BACKLOG

[... rest of plan ...]
```

**Filename**: `add-mcp-tool-filtering-proxy.md`

### Example 2: GitHub-Tracked Plan

```yaml
---
title: "#018: Add Scoped Environment Variable Management"
type: plan
status: Open
issue: 18
url: https://github.com/myorg/ftk/issues/18
tracker: github
synced_at: 2025-11-17T20:30:00Z
tags: ["issue-018", "environment-variables", "security", "mcp"]
---

# #018: Add Scoped Environment Variable Management

**Status**: ⏳ IN PROGRESS

[... rest of plan ...]
```

**Filename**: `018-add-scoped-environment-variable-management.md`

### Example 3: Jira-Tracked Plan

```yaml
---
title: "PRJ-042: Implement Custom Plugin System"
type: plan
status: Open
issue: PRJ-42
url: https://myorg.atlassian.net/browse/PRJ-42
tracker: jira
synced_at: 2025-11-17T20:30:00Z
permalink: plans/prj-042-implement-custom-plugin-system
tags: ["issue-prj-042", "plugins", "architecture", "extensibility"]
---

# PRJ-042: Implement Custom Plugin System

**Status**: 📌 BACKLOG

[... rest of plan ...]
```

**Filename**: `prj-042-implement-custom-plugin-system.md`

## Sequential Thinking Integration Example

### Step 1: User Request

```
User: "I want to add scoped environment variables to FTK so each MCP
only sees its own secrets. Currently using dotenv-cli which exposes
everything to all MCPs."
```

### Step 2: Sequential Analysis

```typescript
// Sequential MCP analyzes the problem
sequential_thinking(
  thought: "This is a complex security problem. Let me break it down:

  1. Security issue: All MCPs see all secrets (violates least privilege)
  2. Current: dotenv-cli loads ALL vars for ALL servers
  3. Need: Scoped filtering per server

  Key questions:
  - How to identify which vars belong to which server?
  - Prefix-based or whitelist-based?
  - File format?

  This will require multiple phases. Let me create a plan note."
)
```

### Step 3: Create Plan

```typescript
// Sequential creates the plan
write_note(
  project: "fluent-toolkit",
  folder: "plans",
  title: "Add Scoped Environment Variable Management with ftk env Command",
  content: `# Add Scoped Environment Variable Management

**Status**: 📌 BACKLOG

## Problem Statement
[Sequential's analysis of the security issue...]

## Proposed Solution
[Sequential's recommended approach...]

## Implementation Plan

### 📌 Phase 1: Core Infrastructure
[Tasks identified by Sequential...]
`
)
```

### Step 4: Reference in Later Sessions

```typescript
// Week later, new session
User: "Continue the environment variable work";

// Read plan to get context
read_note("plans/add-scoped-environment-variable-management");

// Now fully informed:
// - Problem definition
// - Chosen approach
// - What's been done
// - What's next
```

## Tips for Sequential-Driven Plans

1. **Let Sequential do the analysis** - It excels at breaking down complexity
2. **Create plan mid-analysis** - Don't wait until Sequential finishes
3. **Update incrementally** - Add tasks as Sequential identifies them
4. **Capture reasoning** - Put Sequential's "why" in Observations
5. **Review before implementing** - Make sure plan is solid

## Tools

### Basic Memory MCP Commands

```typescript
// Create plan
write_note(project, title, content, folder, tags);

// Update plan
edit_note(project, identifier, operation, content);

// Mark task complete
edit_note(project, identifier, "find_replace", "- [ ]", "- [x]");

// Rename when issue assigned
move_note(project, identifier, new_path);

// Retrieve plan
read_note(project, identifier);

// Find plans
search_notes(project, query);
```

### Sequential MCP Commands

```typescript
// Use for complex analysis
sequential_thinking(thought, thoughtNumber, totalThoughts, nextThoughtNeeded);

// Sequential can write plans directly
// (Sequential has access to all tools including Basic Memory)
```

## See Also

- [Basic Memory Note Conventions](guides/basic-memory-note-conventions) - Overall naming and organization
- [Development Workflow](guides/development-workflow) - Git and commit conventions
- CLAUDE.md - Project-specific instructions
- [Sequential Thinking MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking) - Complex problem-solving tool

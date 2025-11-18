/**
 * Basic Memory instruction content
 */

import type { InstructionContent } from "../types.ts";

export const instructions: InstructionContent = `# Basic Memory

Local-first knowledge management with markdown notes, bidirectional links, and canvas visualization.

## When to Use

- **Project documentation**: Store notes, designs, plans, and research
- **Knowledge graph**: Build connections between related concepts
- **Canvas visualization**: Create visual diagrams linking notes
- **Session persistence**: Cache expensive research results

## Key Capabilities

- **write_note**: Create or update markdown notes with tags and relations
- **read_note**: Read note content
- **search_notes**: Full-text search with filters
- **canvas**: Create Obsidian-style visual knowledge graphs
- **list_directory**: Browse note structure
- **move_note**: Rename or reorganize notes

## Configuration

- **Project**: Notes scoped to current project
- **Kebab-case filenames**: Enabled by default (avoids spaces in filenames)
- **Storage**: Local markdown files (git-friendly, portable)

## Recommended Folder Structure

Organize notes by purpose for better discoverability:

**Core Folders** (create as needed):
- \`plans/\` - Active tasks, implementation plans, work tracking
  - Use for multi-step tasks requiring coordination
  - Include status tracking (📌 BACKLOG, ⏳ IN PROGRESS, ✅ COMPLETED)
  - Link to issues/tickets when applicable

- \`guides/\` - How-to documentation, processes, conventions
  - Team processes and workflows
  - Project-specific conventions
  - Quick reference materials

- \`research/\` - Cached research, technical investigations
  - Expensive API research results (Exa, Firecrawl)
  - Technology evaluations
  - External findings and analysis

**Optional Folders** (use when needed):
- \`features/\` - Feature specs and requirements (product/feature work)
- \`technologies/\` - Architecture docs, tech stack details (complex systems)
- \`decisions/\` - ADRs and architectural decisions (critical choices)
- \`designs/\` - Design documents, system designs (planning phase)
- \`meetings/\` - Meeting notes (team collaboration)

**Folder Selection**:
- Choose folders based on project type and team size
- Start minimal, add folders as patterns emerge
- Consistency matters more than completeness

## Best Practices

- Use tags for categorization
- Add relations to link related concepts
- Follow the recommended folder structure for discoverability
- Format all notes with Prettier after creation
- Use \`move_note\` to reorganize if folder choice wasn't optimal
`;

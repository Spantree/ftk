/**
 * Serena instruction content
 */

import type { InstructionContent } from "../types.ts";

export const instructions: InstructionContent = (ctx) => {
  const hasBasicMemory = ctx.installedModules.includes("basic-memory");

  const memoryIntegration = hasBasicMemory
    ? `
**Memory System Integration:**

Serena has its own memory system (\`.serena/memories/\`) and Basic Memory are complementary:

- **Serena's Memory (.serena/memories/)**:
  - Project structure and architecture
  - Symbol locations and code organization patterns
  - Build systems, testing, and development workflows
  - Technical details needed for code navigation
  - Created during onboarding - gives Serena codebase context

- **Basic Memory (context/basic-memory/)**:
  - High-level architectural decisions and rationale
  - Feature requirements and business logic
  - Cross-cutting concerns and design patterns
  - Research findings and technical spikes
  - Session-persistent knowledge across all tools

**Best Practices:**
- Let Serena's onboarding create its navigation-focused memories
- Use Basic Memory for strategic decisions, research, and planning
- Mirror critical architectural info in both when it aids navigation AND understanding
- Example: Store "why we chose microservices" in Basic Memory, "service locations and dependencies" in Serena memory`
    : `
**Memory System:**

Serena maintains project knowledge in \`.serena/memories/\`:
- Project structure and symbol organization
- Build systems and development workflows
- Architecture patterns for code navigation
- Created during automatic onboarding process`;

  return `# Serena

IDE-like semantic code tools for efficient, symbol-level code operations.

## When to Use

- **Symbol-level operations**: Find, navigate, and edit code at the symbol level (classes, functions, variables)
- **Large codebases**: Efficiently work with large projects without reading entire files
- **Refactoring**: Precise code modifications using semantic understanding
- **Code navigation**: Find symbol definitions, references, and relationships
- **Multi-language projects**: Support for 16+ programming languages via LSP

## Key Capabilities

- **find_symbol**: Locate symbols (classes, functions, methods) across the codebase
- **find_referencing_symbols**: Find all references to a symbol
- **insert_after_symbol**: Add code after specific symbols
- **replace_symbol**: Modify symbol implementations
- **get_symbol_context**: Retrieve surrounding context for a symbol
- **Language support**: Python, TypeScript, Go, Java, Rust, Ruby, PHP, and more

## Configuration

- **Installation**: Requires \`uv\` (Python package manager)
- **Command**: \`uv run serena-mcp-server\`
- **Auth**: None (runs locally)
- **Language Servers**: Automatically downloaded when needed

## Best Practices

- Use Serena for precise, symbol-level edits instead of full-file operations
- Leverage \`find_symbol\` before editing to locate exact code locations
- Use \`find_referencing_symbols\` to understand impact before refactoring
- Let Serena handle language-specific formatting and imports
- Trust Serena's onboarding process to create navigation-focused memories
${memoryIntegration}

## Token Efficiency

Serena is designed for **token-efficient** operations:
- Read only relevant symbols instead of entire files
- Edit specific code locations without full-file replacements
- Navigate via semantic understanding, not grep/search
- Particularly valuable for large codebases and long coding sessions
`;
};

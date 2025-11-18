/**
 * Sequential Thinking instruction content
 */

import type { InstructionContent } from "../types.ts";

export const instructions: InstructionContent = (ctx) => {
  const hasBasicMemory = ctx.installedModules.includes("basic-memory");
  const hasContext7 = ctx.installedModules.includes("context7");
  const hasExa = ctx.installedModules.includes("exa");
  const hasFirecrawl = ctx.installedModules.includes("firecrawl");

  // Build integration section based on installed modules
  const integrations: string[] = [];

  if (hasContext7) {
    integrations.push("- Context7: Use official docs first, then Sequential for architectural analysis");
  }

  if (hasExa) {
    integrations.push("- Exa: Gather information first, then Sequential to synthesize findings");
  }

  if (hasBasicMemory) {
    integrations.push(
      `- Basic Memory: Document Sequential's analysis for future reference
  - Create plan files in \`plans/\` folder to track multi-phase work
  - Break down objectives into phased tasks with status tracking`,
    );
  }

  if (hasFirecrawl) {
    integrations.push("- Firecrawl: Fetch content, then Sequential to analyze patterns");
  }

  const integrationSection = integrations.length > 0
    ? `\n**Integration with Other MCPs**:\n\n${integrations.join("\n")}\n`
    : "";

  return `### Sequential Thinking

**Purpose**: Reflective, exploratory reasoning that supports hypothesis testing and iterative refinement.

**When to Use**:

- Exploratory analysis where the solution approach is uncertain
- Root cause analysis and systematic debugging of complex issues
- Problems requiring hypothesis testing and potential revision of assumptions
- Complex architectural analysis with multiple competing approaches
- Strategic decisions with trade-offs that need systematic evaluation
- Synthesis of findings from multiple sources into coherent recommendations

**When NOT to Use**:

- Simple, straightforward questions
- Quick information lookups (use Context7 or Exa if available)
- Information already documented in Basic Memory

**How It Works**: Sequential provides structured thinking with the ability to revise assumptions, explore alternative approaches, and test hypotheses during analysis. Use it when you need visible, systematic reasoning with course-correction capability.

**Usage**: You can explicitly request Sequential thinking:

**Examples**:

\`\`\`
Using sequential thinking, debug why the authentication system fails intermittently.

Analyze the trade-offs between microservices and monolithic architecture, exploring different approaches.

Investigate the root cause of the performance degradation we're seeing in production.

Systematically evaluate whether to migrate to a new framework, considering multiple options.
\`\`\`
${integrationSection}`;
};

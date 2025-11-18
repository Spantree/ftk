/**
 * RefTools instruction content
 */

import type { InstructionContent } from "../types.ts";

export const instructions: InstructionContent = (ctx) => {
  const hasBasicMemory = ctx.installedModules.includes("basic-memory");
  const hasSequential = ctx.installedModules.includes("sequential");
  const hasExa = ctx.installedModules.includes("exa");

  const integrations: string[] = [];

  if (hasSequential) {
    integrations.push("- RefTools → Sequential: Fetch docs, analyze architecture");
  }

  if (hasBasicMemory) {
    integrations.push("- RefTools → Basic Memory: Cache findings to guides/");
  }

  if (hasExa) {
    integrations.push("- Use RefTools BEFORE Exa for library-specific questions");
  }

  const integrationSection = integrations.length > 0
    ? `\n**Integration:**\n${integrations.join("\n")}\n`
    : "";

  const strategicUse = hasExa
    ? `**Strategic Use:**
1. **RefTools**: Library-specific questions, API docs, iterative exploration
2. **Exa**: Broader research, tutorials, community discussions
3. **Web search**: Current events, specific error debugging

`
    : "";

  return `# RefTools

Token-optimized documentation search with 50-70% token savings vs alternatives. Credit-based (1000/month free).

${strategicUse}**Key Advantages:**
- **Token efficiency**: 50-70% average savings (up to 95%)
- **Session-driven**: Iterative search with deduplication
- **Universal access**: Any web resource, not just library docs
- **Tools**: \`ref_search_documentation\`, \`ref_read_url\`, \`ref_search_web\`

**Recommended Workflows:**

*Learning new library:*
1. Search: "React hooks documentation and examples"
2. Read: Refine with \`ref_read_url\` on specific docs
3. Iterate: Follow-up searches based on findings

*API reference:*
- Quick lookup: "Express.js middleware signature"
- Deep dive: "TypeScript generic constraints with examples"

*Best practices:*
- "Async error handling patterns in Node.js"
- "React component composition best practices"

**Performance:**
- **Rate limits**: 10 req/sec
- **Credits**: 1 credit per tool call
- **Free tier**: 1000 credits/month (adequate for development)
- **Optimization**: Session caching reduces duplicate requests
${integrationSection}`;
};

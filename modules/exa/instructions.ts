/**
 * Exa instruction content
 */

import type { InstructionContent } from "../types.ts";

export const instructions: InstructionContent = (ctx) => {
  const hasBasicMemory = ctx.installedModules.includes("basic-memory");
  const hasFirecrawl = ctx.installedModules.includes("firecrawl");

  // Build best practices section based on installed modules
  const bestPractices: string[] = [
    "- Use `deep_researcher_start` for complex multi-source research",
    "- Poll with `deep_researcher_check` until research completes",
  ];

  if (hasBasicMemory) {
    bestPractices.push("- Cache expensive research results to Basic Memory");
  }

  if (hasFirecrawl) {
    bestPractices.push("- Use Exa for semantic/neural search when you need AI-powered relevance");
  }

  bestPractices.push(
    "- Prefer semantic search over traditional keyword search",
    "- Use `company_research_exa` for business intelligence",
  );

  return `# Exa

AI-powered search and deep research with neural search capabilities.

## When to Use

- **AI-powered search**: Find highly relevant content using neural search
- **Deep research**: Comprehensive research with synthesis and analysis
- **Semantic search**: Search by meaning, not just keywords
- **Company research**: Find detailed information about businesses
- **Content discovery**: Discover related content and connections

## Key Capabilities

- **web_search_exa**: Real-time web search with configurable result counts
- **company_research_exa**: Research companies with comprehensive insights
- **crawling_exa**: Extract and crawl content from specific URLs
- **linkedin_search_exa**: Search LinkedIn profiles and companies
- **deep_researcher_start**: Start comprehensive AI research tasks (v2.1.0+)
- **deep_researcher_check**: Check status and retrieve research results (v2.1.0+)

## Configuration

- **API Key**: Required (get from https://app.exa.ai/api-keys)
- **Version**: Pinned to 2.1.0 for deep research tool support

## Best Practices

${bestPractices.join("\n")}
`;
};

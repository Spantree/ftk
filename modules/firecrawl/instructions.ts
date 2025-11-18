/**
 * Firecrawl instruction content
 */

import type { InstructionContent } from "../types.ts";

export const instructions: InstructionContent = (ctx) => {
  const hasExa = ctx.installedModules.includes("exa");

  const bestPractices: string[] = [
    "- Use `map` before `crawl` to discover URLs",
    "- Use `maxAge` parameter for faster scrapes with cached data",
    "- Prefer `batch_scrape` over multiple `scrape` calls",
    "- Use `extract` for structured data extraction with schemas",
  ];

  if (hasExa) {
    bestPractices.push("- Use Firecrawl when you need clean content extraction or structured data from specific URLs");
  }

  return `# Firecrawl

Web scraping and crawling with AI-powered content extraction.

## When to Use

- **Web scraping**: Extract clean content from any website
- **Batch scraping**: Process multiple URLs efficiently
- **Site mapping**: Discover all URLs on a website
- **Web search**: Find and scrape search results
- **Crawling**: Deep crawl websites with automatic discovery
- **Structured extraction**: Extract specific data using schemas

## Key Capabilities

- **scrape**: Extract content from a single URL (markdown, HTML, screenshots)
- **batch_scrape**: Process multiple URLs in parallel
- **map**: Discover all indexed URLs on a site
- **search**: Search the web and optionally scrape results
- **crawl**: Deep crawl with automatic page discovery
- **extract**: Extract structured data using LLM with schemas

## Configuration

- **API Key**: Required (get from https://www.firecrawl.dev/app/api-keys)
- **Credits**: Free tier includes 1,000 credits/month
- **Rate Limits**: Credit-based system

## Best Practices

${bestPractices.join("\n")}
`;
};

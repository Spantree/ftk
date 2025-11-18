---
title: "2025-11-13 102:980: FireCrawl MCP Server Integration"
type: note
permalink: research/2025-11-13-102-980-fire-crawl-mcp-server-integration
tool: exa_deep_researcher
model: exa-research
task_id: 01k9zfnpdewqcjcvf8btace6e8
status: completed
created_at: 2025-11-13 00:00:00+00:00
duration_ms: 102980
query_type: deep_research
cached_via: exa_researcher_agent
tags:
  - firecrawl
  - mcp-server
  - ftk
  - web-scraping
  - integration
instructions: |
  Research Topic: FireCrawl MCP Server Integration for ftk Toolkit

  Context:
  - ftk is an MCP server installer with modular architecture (lifecycle methods: precheck, configure, install)
  - Existing modules: Context7, Exa, Sequential
  - Need FireCrawl module with API key configuration for workshop web scraping

  Research Questions:
  1. Exact npm package name for FireCrawl MCP server?
  2. Current stable version?
  3. API key authentication details?
  4. Core scraping tools: scrape, crawl, map, search, extract capabilities?
  5. Configuration options: formats, parsers, waitFor, mobile, cache, actions?
  6. Rate limits and pricing: free tier limits, paid tiers, cost structure?
  7. Decision framework: When to use FireCrawl vs EXA?
  8. Common issues: API errors, timeouts, rate limits, troubleshooting?
---

# Comprehensive Research Report on FireCrawl MCP Server Integration for ftk Toolkit

## 1. Package Name, Version, and Installation

The official npm package name for the FireCrawl MCP server is `firecrawl-mcp`. This package is designed as an MCP (Model Context Protocol) server integration that supports both cloud and self-hosted instances, enabling advanced web scraping capabilities. The current stable version is 1.9.0, released in April 2025. Installation is done via npm: `npm install firecrawl-mcp`. This package integrates with AI agents and LLM clients such as Cursor and Claude to provide web scraping and research functionalities.

## 2. API Key Authentication

The FireCrawl MCP server uses an API key for authentication, supplied through the environment variable `FIRECRAWL_API_KEY`. Users must obtain this key by signing up on the FireCrawl platform or related portals. Setup involves opening the Cursor or relevant client settings, navigating to Features > MCP Servers, adding a new MCP server with the name `firecrawl-mcp`, and setting the command to include the environment variable, e.g., `env FIRECRAWL_API_KEY=your-api-key npx -y firecrawl-mcp`.

## 3. Core Scraping Tools and Capabilities

FireCrawl MCP server offers a suite of tools:

- **scrape**: Extracts content from one or multiple pages with batch capabilities.
- **crawl**: Systematically discovers and navigates linked pages.
- **map**: Maps website structure for targeted scraping.
- **search**: Searches content within scraped data.
- **extract**: Converts scraped content into clean Markdown or HTML for LLM ingestion.

These tools enable structured data extraction, dynamic content handling, and comprehensive web research.

## 4. Configuration Options

Key configuration options include:

- **formats** (Markdown, HTML, plain text)
- **parsers** (JavaScript rendering support)
- **waitFor** (wait for page elements before scraping)
- **mobile** (emulate mobile browsers)
- **cache (maxAge)** (cache scraped content to reduce requests)
- **actions** (custom actions like clicks, form fills, scrolling)

Defaults are optimized for general use but customizable for dynamic or SPA sites.

## 5. Rate Limits and Pricing

FireCrawl's pricing tiers and rate limits are:

- **Free Tier**: 10 requests/minute for `/scrape` and `/map` endpoints.
- **Hobby**: 100 requests/minute.
- **Standard**: 500 requests/minute.
- **Growth**: 5000 requests/minute.

The free tier is suitable for educational workshops and small projects, allowing experimentation without financial commitment.

## 6. Decision Framework: FireCrawl vs EXA

FireCrawl is ideal for structured scraping, deep crawling, and comprehensive content extraction, especially for dynamic or JavaScript-heavy sites. EXA is optimized for semantic research and real-time search, offering faster responses but less deep crawling.

Use FireCrawl for extensive web data ingestion and EXA for speedy semantic search over curated data. FireCrawl trades some speed for thoroughness and structure.

## 7. Common Issues and Troubleshooting

Common issues include invalid API keys or malformed requests causing API errors, network timeouts from slow page loads (adjustable via waitFor), rate limit exceedance (implement retry with backoff), and invalid URLs causing errors (validate URLs before scraping).

Troubleshooting involves checking logs, environment variables, and applying best practices for retries and error handling.

## 8. ftk Module Implementation Guidance

To integrate FireCrawl MCP server into the ftk toolkit:

- Implement lifecycle methods: `precheck` (validate API key), `configure` (set formats, parsers, caching), and `install` (install package and set up command).
- Use `FIRECRAWL_API_KEY` environment variable for authentication.
- Integrate FireCrawl commands within ftk modular architecture.
- Reference Context7 and Exa modules for API key and lifecycle handling.
- Provide default configurations for mobile emulation and caching.
- Incorporate error handling and rate limit awareness.

This ensures modular, scalable, and secure integration within ftk.

---

## Observations

- [resource] FireCrawl official npm package is firecrawl-mcp (NOT @mendable/firecrawl-mcp) for package discovery #npm #package
- [fact] FireCrawl current stable version is 1.9.0 (April 2025) with active maintenance and updates #version #maintenance
- [method] FireCrawl uses environment variable FIRECRAWL_API_KEY for authentication consistent with security practices #authentication #environment-variables #security
- [fact] FireCrawl provides five core tools: scrape, crawl, map, search, extract covering comprehensive web data needs #tools #capabilities
- [pricing] FireCrawl free tier provides 10 requests/minute suitable for educational workshops and small projects #free-tier #rate-limits
- [fact] FireCrawl optimized for structured scraping vs EXA optimized for semantic research indicating distinct use cases #optimization #use-cases
- [method] FireCrawl follows same pattern as Context7 and Exa modules in ftk enabling consistent architecture #architecture #patterns

## Relations

- requires [[design/ftk-module-system-use-cases]] (module system design requirements)
- contrasts_with [[research/2025-01-13-76-15-exa-mcp-deep-research-api]] (different optimization focus)
- pairs_well_with [[research/2025-11-13-00-00-00-tavali-mcp-server-integration]] (complementary web capabilities)
- relates_to [[research/2025-11-13-23-00-00-sequential-thinking-mcp-server]] (coordinated workflow integration)
- documented_in https://www.npmjs.com/package/firecrawl-mcp/v/1.9.0 (npm package)
- documented_in https://docs.firecrawl.dev/mcp-server (MCP server documentation)
- documented_in https://github.com/firecrawl/firecrawl-mcp-server (GitHub repository)

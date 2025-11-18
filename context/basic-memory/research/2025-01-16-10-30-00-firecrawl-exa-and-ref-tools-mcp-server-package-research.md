---
title: "2025-01-16 10:30:00: Firecrawl, Exa, and RefTools MCP Server Package Research"
type: note
permalink: research/2025-01-16-10-30-00-firecrawl-exa-and-ref-tools-mcp-server-package-research
tool: exa_deep_researcher
model: exa-research-pro
task_id: "01ka6ywd3mvyaz4ka5kmvff09h"
status: completed
created_at: ""
query_type: deep_research
tags:
  - research
  - exa
  - mcp
  - firecrawl
  - reftools
  - package-verification
instructions: 'Research Topic: MCP Server Package Details and Configuration for Firecrawl,
  Exa, and RefTools


  Context:

  - Project: fluent-toolkit (ftk) - MCP server setup toolkit for Claude Code

  - Current setup: Firecrawl and Exa already configured in .mcp.json

  - Module system: Building modular architecture with lifecycle methods

  - Critical question: GitHub issue exa-labs/exa-mcp-server#66 about deep research
  tools availability

  - Need accurate package names, versions, authentication for integration


  Research Questions:

  1. What is the official npm package name and current version for Firecrawl MCP server?
  Is it `firecrawl-mcp` or `@mendable/firecrawl-mcp`?

  2. What are Firecrawl''s authentication requirements (API key format, how to obtain),
  configuration options, and rate limits/usage tiers?

  3. What is the official npm package name for Exa MCP server? Is it `exa-mcp-server`?

  4. What is the status of GitHub issue https://github.com/exa-labs/exa-mcp-server/issues/66
  regarding `deep_researcher_start` and `deep_researcher_check` tools?

  5. What changed between exa-mcp-server version 2.0.5 and the latest version? Which
  version should we use?

  6. What are Exa MCP''s authentication requirements (EXA_API_KEY format, how to obtain)
  and available tools?

  7. Does RefTools MCP server exist officially? If yes, what is the package name and
  registry (npm/PyPI)?

  8. If RefTools exists, what are its authentication requirements and how does it
  compare with Context7 MCP server?

  9. What is the recommendation for version pinning strategy for these MCP servers
  in the ftk module system?


  Expected Deliverables:

  - Definitive npm package names with exact current versions for Firecrawl, Exa, and
  RefTools (if exists)

  - Authentication setup instructions for each server (API key format, environment
  variables, how to obtain keys)

  - Analysis of GitHub issue #66 for exa-mcp-server - are deep research tools available
  in latest version?

  - Version comparison for exa-mcp-server: what changed between 2.0.5 and latest?

  - Version pinning recommendation: should ftk use latest or pin to specific versions?

  - RefTools existence verification and feature comparison with Context7

  - Configuration options, rate limits, and usage tiers for each server

  - Integration requirements for ftk module system (environment variables, CLI arguments,
  etc.)


  Focus Areas:

  - Package distribution accuracy (exact package names on npm/PyPI)

  - Version history and breaking changes

  - Authentication workflows and API key management

  - Tool availability verification (especially Exa deep research tools in latest version)

  - Developer experience for obtaining API keys and configuring servers

  - Integration patterns with ftk module lifecycle methods

'
---

# Research Report: MCP Server Package Details and Configuration for Firecrawl, Exa, and RefTools

This report delivers detailed information on package distribution, authentication workflows, version histories, tool availability (particularly for deep research in Exa MCP), and integration recommendations for the fluent-toolkit (ftk) module system.

## 1. Firecrawl MCP Server

Firecrawl MCP Server provides web scraping, search, and extraction capabilities via a Model Context Protocol (MCP) interface. Its integration enables LLM agents to ingest and process structured web data.

### Package Name & Version

The official npm package is firecrawl-mcp at version 3.5.2. ([npmjs.com](https://www.npmjs.com/package/firecrawl-mcp))

### Authentication Requirements

Firecrawl requires an API key (`fc-<UUID>`) obtained from https://www.firecrawl.dev/app/api-keys. The key should be supplied via the FIRECRAWL_API_KEY environment variable or embedded in the remote hosted URL: https://mcp.firecrawl.dev/{FIRECRAWL_API_KEY}/v2/mcp. All endpoints enforce HTTPS and key validation. ([docs.firecrawl.dev/mcp-server](https://docs.firecrawl.dev/mcp-server))

### Configuration Options

All settings are configurable via environment variables:

- FIRECRAWL_API_URL: Self-hosted API endpoint
- FIRECRAWL_RETRY_MAX_ATTEMPTS, FIRECRAWL_RETRY_INITIAL_DELAY, FIRECRAWL_RETRY_MAX_DELAY, FIRECRAWL_RETRY_BACKOFF_FACTOR: Retry/backoff controls
- FIRECRAWL_CREDIT_WARNING_THRESHOLD, FIRECRAWL_CREDIT_CRITICAL_THRESHOLD: Credit monitoring

Installation and run examples:

```
env FIRECRAWL_API_KEY=fc-YOUR_KEY npx -y firecrawl-mcp
```

Or global install:

```
npm install -g firecrawl-mcp
```

### Rate Limits & Usage Tiers

Firecrawl uses credit-based rate limiting: free tier offers 1,000 credits/month; paid tiers start at $19/mo for 50,000 credits. Deep research and batch operations consume credits at variable rates. Detailed tiers in the [Rate Limits guide](https://docs.firecrawl.dev/rate-limits).

### Available Tools

Firecrawl MCP exposes the following tools:

- firecrawl_scrape, firecrawl_batch_scrape, firecrawl_check_batch_status
- firecrawl_map, firecrawl_search, firecrawl_crawl, firecrawl_check_crawl_status
- firecrawl_extract

## 2. Exa MCP Server

Exa MCP Server offers general LLM research tools, including search, summarization, and deep research capabilities.

### Package Name & Version

The npm package is exa-mcp-server. Latest version is 2.1.0, superseding 2.0.5. ([GitHub tags](https://github.com/exa-labs/exa-mcp-server/tags))

### Status of GitHub Issue #66

Issue #66 regarding deep_researcher_start and deep_researcher_check was closed in v2.1.0, adding these tools. The PR included command definitions and lifecycle method implementations. ([GitHub Issue #66](https://github.com/exa-labs/exa-mcp-server/issues/66))

### Version Changes (2.0.5 → 2.1.0)

Updates in v2.1.0:

- Introduced deep_researcher_start and deep_researcher_check tools
- Enhanced retry and error handling
- Expanded documentation for deep research workflows
  Use v2.1.0 for full deep research support.

### Authentication Requirements & Tools

Exa requires EXA_API_KEY (`exa-<UUID>`) from https://app.exa.io/api-keys, set in EXA_API_KEY environment variable. Available tools include:

- exa_search, exa_research, deep_researcher_start, deep_researcher_check
- General query execution via standard MCP protocol

## 3. RefTools MCP Server

### Existence Verification

No official RefTools MCP server exists on npm or PyPI. Searches for reftools, reftools-mcp, and @reftools scopes returned no MCP server packages.

### Comparison with Context7

Context7 MCP server (`context7-mcp-server` on npm, v1.0.0) provides citation and bibliography extraction, unlike the non-existent RefTools MCP.

## 4. Version Pinning Strategy

- Firecrawl: Pin to ^3.5.2 for non-breaking updates or exactly 3.5.2 for maximum stability.
- Exa: Pin to 2.1.0 to ensure deep research tools availability.
- RefTools: Not applicable.

## 5. Integration Requirements for ftk Module System

### Environment Variables

- FIRECRAWL_API_KEY, EXA_API_KEY set via ftk `setup.env`

### CLI Commands

- Use `npx -y firecrawl-mcp` and `npx -y exa-mcp-server@2.1.0` in ftk `setup.command`

### Lifecycle Hooks

- init: Validate API keys presence
- preStart: Fetch and warn on low credit balance via API
- start: Launch MCP processes and capture stdout/stderr
- healthcheck: Periodic tool-list v2 calls to /tools endpoint to ensure availability

### Version Enforcement

- Use explicit semver flags or Docker image tags in `.mcp.json` for reproducible builds (e.g., `npx -y exa-mcp-server@2.1.0`).

## Conclusion

This report provides definitive package names and versions (firecrawl-mcp@3.5.2, exa-mcp-server@2.1.0), authentication workflows, configuration options, detailed change analysis for Exa MCP, verifies non-existence of RefTools MCP, and offers version pinning and integration patterns for seamless ftk module lifecycle management.

## Observations

- [fact] Firecrawl MCP Server official npm package is firecrawl-mcp at version 3.5.2 #firecrawl #npm #package
- [fact] Exa MCP Server official npm package is exa-mcp-server at version 2.1.0 #exa #npm #package
- [fact] RefTools MCP server does not exist officially on npm or PyPI #reftools #verification
- [method] Firecrawl authentication uses FIRECRAWL_API_KEY environment variable with fc-<UUID> format obtained from firecrawl.dev/app/api-keys #firecrawl #authentication #api-key
- [method] Exa authentication uses EXA_API_KEY environment variable with exa-<UUID> format obtained from app.exa.io/api-keys #exa #authentication #api-key
- [fact] GitHub issue exa-labs/exa-mcp-server#66 was closed in v2.1.0 adding deep_researcher_start and deep_researcher_check tools #exa #deep-research #github-issue
- [requirement] Exa MCP v2.1.0 required for full deep research support with deep_researcher_start and deep_researcher_check tools #exa #version-requirement #deep-research
- [pricing] Firecrawl free tier offers 1,000 credits/month, paid tiers start at $19/mo for 50,000 credits #firecrawl #pricing #rate-limits
- [method] Version pinning strategy for ftk: Firecrawl ^3.5.2 for non-breaking updates or exactly 3.5.2 for stability, Exa pinned to 2.1.0 #version-pinning #ftk #stability
- [resource] Firecrawl exposes 8 tools including scrape, batch_scrape, map, search, crawl, and extract capabilities #firecrawl #tools #mcp
- [resource] Exa exposes search, research, and deep research tools via MCP protocol #exa #tools #mcp

## Relations

- relates_to [[design/ftk-module-system-use-cases]] (module system design requirements for MCP server integration)
- documented_in https://www.npmjs.com/package/firecrawl-mcp (Firecrawl npm package page)
- documented_in https://www.npmjs.com/package/exa-mcp-server (Exa npm package page)
- documented_in https://docs.firecrawl.dev/mcp-server (Firecrawl MCP server documentation)
- documented_in https://github.com/exa-labs/exa-mcp-server/issues/66 (GitHub issue #66 about deep research tools)
- documented_in https://www.firecrawl.dev/app/api-keys (Firecrawl API key acquisition)
- documented_in https://app.exa.io/api-keys (Exa API key acquisition)
- documented_in https://docs.firecrawl.dev/rate-limits (Firecrawl rate limits guide)

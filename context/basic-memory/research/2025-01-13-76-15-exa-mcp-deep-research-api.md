---
title: "2025-01-13 76:15: EXA MCP Deep Research API"
type: note
permalink: research/2025-01-13-76-15-exa-mcp-deep-research-api
tool: exa_deep_researcher
model: exa-research-pro
task_id: 01k9zfmr9j8dkyyf229pyjrak5
status: completed
created_at: 2025-01-13 00:00:00+00:00
duration_ms: 76150
query_type: deep_research
cached_via: exa_researcher_agent
tags:
  - exa
  - mcp-server
  - deep-research
  - api
  - ftk
instructions: |
  Research Topic: Exa Deep Researcher implementation in ftk

  Focus:
  - Deep research API lifecycle and polling strategy
  - Task management and timeout handling
  - Output format and caching patterns
  - PyPI package (mcp-server-exa) details
  - Error handling and rate limits

  Target Implementation:
  - ftk orchestration agent with automatic caching
---

# Exa MCP Server Deep Research API Implementation Guide

This implementation guide provides a comprehensive overview of integrating Exa's Deep Research API into the fluent-toolkit (ftk) MCP server setup wizard, focusing on TypeScript/Deno subagent implementation.

## 1. Deep Research API Lifecycle

Exa's asynchronous Research API enables multi-step, agent-driven workflows to transform open-ended instructions into grounded reports. The lifecycle comprises:

1. **Task Creation**: Submit a POST request to `/research/v1/research/v1` with `model`, `instructions`, and optional `outputSchema`. A `researchId` is returned immediately with `pending` status.
2. **Tracking ID**: `researchId`s are opaque strings (e.g., `01jszdfs0052sg4jc552sg4jc5`) used for polling and retrieval.
3. **Polling Mechanism**: Use GET `/research/v1/research/v1/{researchId}` to retrieve the task's `status`. Recommended intervals start at 2-5 seconds, employing exponential backoff up to 30 seconds, capping total wait time to 10-15 minutes.
4. **Status Transitions**: `pending → running → completed|failed`. Optional SSE with `?stream=true` can push real-time status updates. Including `?events=true` returns detailed event logs.
5. **Completion Detection & Retrieval**: Once `status: completed`, the final response includes `result` (JSON or markdown). Failed tasks return an error code with partial logs if available.

## 2. MCP Server Integration

The `exa-mcp-server` package (npm v3.0.9) exposes the Research API as MCP tools.

**Installation**: npm install -g exa-mcp-server or via Smithery plugin. The package is also on PyPI (via `mcp-server-exa` alias) for Python-based hosts.

**MCP Tools**: `deep_researcher_start` invokes research.create; `deep_researcher_check` invokes research.get. Tool schemas include model enum with values: exa-research-fast, exa-research, exa-research-pro; instructions (string); outputSchema (object).

**Configuration**: Set `EXA_API_KEY` via environment or URL query (`?exaApiKey=`). Default enabled tools include web_search_exa and get_code_context_exa; specify `--tools` to enable research tools.

**Version Compatibility**: v3.x is stable; tokens expiring every 90 days require periodic rotation.

## 3. Output Format and Structure

The API returns JSON objects when `outputSchema` is provided (parsed and validated against the schema) or Markdown reports if no schema is specified, structured with sections, inline citations, and a sources list.

Response includes metadata: researchId, model, instructions, status, createdAt, completedAt, result object. Additional fields: tokenCount, searchCount, pagesRead, reasoningTokens. Final markdown includes a URL list.

## 4. Polling Strategy and Performance

**Durations** (p50/p90): exa-research: 45s/90s; exa-research-pro: 90s/180s.

**Polling Intervals**: Start at 5s, double every retry up to 30s. Cease after total of 15 minutes. SSE with `stream=true` reduces unnecessary polls. Detect stalled tasks if no status change after 5 consecutive intervals.

**Timeouts**: Fail tasks at 20 minutes server-side; client-side timeout ~15 minutes recommended.

## 5. Error Handling and Edge Cases

**HTTP Errors**: 400 Bad Request (validation), 401 Unauthorized (invalid/missing key), 403 Forbidden (quota), 429 Rate Limit, 500 Internal.

**Task Failures**: status: failed with error object containing code and message.

**Retry Strategies**: Retry on 429/502/503 with exponential backoff. Do not retry 400/404.

**Partial Results**: Use `?events=true` to retrieve intermediate logs. Cache partial outputs if needed.

## 6. Caching Best Practices

**Format**: Store raw JSON (with result and metadata) alongside markdown. Include taskId, createdAt, completedAt in cache metadata.

**File Naming**: `{instructions_slug}_{model}_{researchId}.json`

**Deduplication**: Hash instructions + model; reuse cached results if a match found within TTL (e.g., 24h).

**Invalidation**: Invalidate on API version bump or explicit parameter change. Use a cache index file mapping hash to file paths.

## 7. API Keys and Authentication

**Key Format**: 32-character alphanumeric. Obtain via dashboard.exa.ai/api-keys.

**Env Var**: `EXA_API_KEY`; alternative `FTK_EXA_API_KEY` if multiple keys used.

**Rate Limits**: Default 60 requests/min; research tasks count towards search/page quotas.

**Pricing Tiers**: Free tier includes 50 searches/day; exa-research-pro extra cost.

**Rotation**: Rotate every 90 days; revoke old keys via dashboard.

## 8. Research Models

- **exa-research-fast**: Minimal compute, faster (~30s p50), lower cost; suited for simple queries.
- **exa-research** (default): Balances speed (45s p50) and depth.
- **exa-research-pro**: Highest quality (90s p50), cost multiplier ×1.7; ideal for multi-step, schema-driven tasks.

**Cost**: $5/1k searches, $5-$10/1k pages, $5/1M reasoning tokens. Pro's page-read cost doubles.

---

## Observations

- [method] EXA Research API uses asynchronous task creation with polling-based retrieval (no websocket support documented) #async #polling #api
- [fact] EXA provides three research models available with distinct performance profiles: fast (30s), standard (45s), pro (90s p50) #models #performance
- [method] EXA polling exponential backoff strategy starts at 5s, doubles to 30s max, with total wait up to 15 minutes #polling #backoff #strategy
- [method] EXA optional SSE streaming with stream=true query parameter reduces polling overhead for long-running tasks #sse #streaming #optimization
- [method] EXA caching pattern with hash-based deduplication enables cost savings on repeated research queries #caching #deduplication #cost-optimization
- [security] EXA token rotation required every 90 days with API key management via dashboard #security #api-keys #rotation
- [pricing] EXA free tier includes 50 searches/day with additional cost for research-pro model #free-tier #pricing

## Relations

- contrasts_with [[research/2025-01-13-00-00-00-ref-tools-mcp-server-integration]] (alternative research approach)
- pairs_well_with [[research/2025-11-13-00-00-00-tavali-mcp-server-integration]] (complementary search capabilities)
- relates_to [[research/2025-11-13-23-00-00-sequential-thinking-mcp-server]] (coordinated workflow integration)
- documented_in https://docs.exa.ai/reference/research/create-a-task (API task creation)
- documented_in https://docs.exa.ai/reference/exa-research (research models documentation)
- documented_in https://www.npmjs.com/package/exa-mcp-server (npm package)

---
title: "2025-01-13 00:00:00: RefTools MCP Server Integration"
type: note
permalink: research/2025-01-13-00-00-00-ref-tools-mcp-server-integration
tool: exa_deep_researcher
model: exa-research-pro
task_id: 01k9zfn34fppn52sye53bvhw22
status: completed
created_at: 2025-01-13 00:00:00+00:00
duration_ms: 58212
query_type: deep_research
cached_via: exa_researcher_agent
tags:
  - reftools
  - mcp
  - ftk
  - integration
  - research
instructions: |
  Research Topic: RefTools MCP Server Integration for ftk

  Context:
  - Basic Memory ftk module system needs to handle mutually exclusive tools (Context7 vs RefTools in code-context-providers conflict group)
  - Project: ftk is a Deno-based CLI toolkit for configuring MCP servers in Claude Code
  - Technical context: RefTools is positioned as an alternative to Context7 for code documentation/context
  - Use case: ftk needs to support optional vs required secrets, mutually exclusive groups, and provide setup guidance

  Research Questions:
  1. What is RefTools and is there an official MCP server implementation available?
  2. What are the authentication requirements (API key format, scopes, registration process)?
  3. How does RefTools compare to Context7 in terms of features, capabilities, and use cases?
  4. What are the rate limits, pricing tiers, and free tier limitations?
  5. When should developers choose RefTools over Context7?
  6. What is the MCP package name, registry (npm/PyPI), and installation method?

  Expected Deliverables:
  - RefTools product overview and capabilities
  - MCP server availability and package details
  - Authentication workflow and API key requirements
  - Feature comparison with Context7
  - Recommendation criteria
  - Rate limits and pricing
  - Integration requirements for ftk
---

# RefTools MCP Server Integration for ftk: Comprehensive Research Report

## Introduction

This report examines RefTools, a Model Context Protocol (MCP) server offering up-to-date technical documentation search capabilities, and its integration into the Deno-based CLI toolkit ftk for configuring MCP servers in Claude Code. We explore RefTools' product overview, MCP server implementation, authentication workflow, feature comparison with Context7, pricing and rate limits, and practical guidance for ftk module configuration.

## 1. RefTools Overview and MCP Server Implementation

RefTools is an MCP server designed to provide AI coding tools and agents with efficient, token-optimized access to technical documentation for APIs, services, libraries, and internal resources. It implements the full Model Context Protocol as a streamable HTTP server at `https://api.ref.tools/mcp`, enabling seamless integration with any MCP-compatible client without local installation.

RefTools offers two deployment modes: a legacy local stdio subprocess (`npx ref-tools-mcp`) and a recommended streamable HTTP server. The stdio setup uses an environment variable `REF_API_KEY` for authentication, while the HTTP mode accepts an `x-ref-api-key` header or `apiKey` query parameter. The official GitHub repository `ref-tools/ref-tools-mcp` hosts the code, with a Dockerfile and npm package for local development and CI/CD workflows.

### 1.1 MCP Package Details

- Package name: `ref-tools-mcp` (npm)
- Registry: npm (with `npx ref-tools-mcp@latest`) and GitHub releases
- Versioning: Semantic versioning, latest tag available on npm and GitHub

## 2. Authentication Workflow and API Key Requirements

Users must sign up at ref.tools/signup to obtain an API key. Authentication is supported in two forms: Header `x-ref-api-key: YOUR_API_KEY` or Query parameter `?apiKey=YOUR_API_KEY`. API keys are long alphanumeric strings generated per user account on the RefTools dashboard. Current scopes allow full access to public documentation tools; no granular scopes are documented, implying a single-scope model for all tools.

## 3. Feature Comparison: RefTools vs Context7

### 3.1 Context7 Overview

Context7 is an MCP server from Upstash offering version-specific code documentation retrieval through batch RAG strategies with fixed token budgets (10K tokens) per query. It provides tools `resolve-library-id` and `get-library-docs` but lacks stateful session support and web scraping capabilities.

### 3.2 Comparative Snapshot

RefTools excels in token efficiency (50-70% savings on average, up to 95%), session-driven exploration, and universal web resource access through iterative search and read capabilities. It provides tools `ref_search_documentation`, `ref_read_url`, and optional `ref_search_web`, plus pre-built prompts for search and indexing. Context7 maintains simplicity with fixed budgets and predictable behavior ideal for straightforward library documentation lookups.

## 4. Rate Limits, Pricing Tiers, and Free Tier

RefTools operates on a credit-based model where each tool call consumes one credit. Pricing details as of November 2025:

- Free tier: 1,000 credits/month ($0.00)
- Basic plan: 5,000 credits/month for $9/month
- Pro plan: 50,000 credits/month for $49/month
- Enterprise: Custom credits, dedicated support and SLAs

Rate limits enforce 10 requests/sec per key on the streamable HTTP endpoint and 5 requests/sec on stdio proxies to prevent abuse.

## 5. Choosing RefTools vs Context7

Use RefTools when: iterative search sessions are required, token cost optimization is critical, access to arbitrary web resources beyond library docs is needed, or enterprise features like team RBAC and private repo indexing are essential.

Use Context7 when: simplicity and predictable behavior with fixed budgets suffice, only public library documentation is needed with minimal configuration, or integration with Upstash services exists.

## 6. Integration Requirements for ftk

To integrate RefTools into ftk, config fields must handle mutually exclusive groups (Context7 vs RefTools). ftk should support optional vs required secrets: `refApiKey` (required for HTTP, optional for stdio), group definition under `codeContextProviders` where users choose one provider, and setup guidance with code snippets for HTTP and stdio modes.

Example ftk module configuration with HTTP setup using `https://api.ref.tools/mcp?apiKey=${apiKey}` and stdio setup using `npx ref-tools-mcp@latest` with `REF_API_KEY` environment variable.

---

## Observations

- [fact] RefTools implements full Model Context Protocol as HTTP streamable server at https://api.ref.tools/mcp (not legacy stdio-only) #mcp #http #deployment
- [performance] RefTools token optimization achieves 50-70% savings on average with up to 95% in some scenarios compared to Context7's fixed budget approach #optimization #tokens
- [method] RefTools API key authentication supports both header (x-ref-api-key) and query parameter methods for flexibility across deployment modes #authentication #http
- [pricing] RefTools free tier provides 1,000 credits/month for adequate testing capacity in development workflows #free-tier #credits
- [requirement] RefTools requires explicit mutual exclusion with Context7 in ftk module system design #exclusivity #design
- [method] RefTools session-driven search with deduplication and caching fundamentally differs from Context7's single-query batch RAG approach #search #architecture
- [resource] RefTools official npm package is ref-tools-mcp with HTTP deployment preferred over deprecated stdio mode #npm #package

## Relations

- contrasts_with [[research/2025-01-13-02-00-00-context7-mcp-server-integration-requirements]] (mutually exclusive alternative)
- relates_to [[research/2025-11-13-76-15-exa-mcp-deep-research-api]] (comparison research)
- requires [[design/ftk-module-system-use-cases]] (module system design requirements)
- documented_in https://docs.ref.tools/install (installation guide)
- documented_in https://docs.ref.tools/comparison/context7 (feature comparison)
- documented_in https://ref.tools/signup (API key registration)

---
title: "2025-01-13 02:00:00: Context7 MCP Server Integration Requirements"
type: note
tool: exa_deep_researcher
model: exa-research-pro
task_id: 01k9zfmvcq07ew5je7jgc2rm5s
status: completed
created_at: "2025-01-13T02:00:00Z"
duration_ms: 79472
query_type: deep_research
tags:
  - research
  - exa
  - context7
  - mcp
  - authentication
instructions: |
  Research Topic: Context7 MCP Server Integration Requirements

  Context:
  - Basic Memory design/ftk-module-system-use-cases documents that Context7 is mutually exclusive with RefTools
  - Project files: fluent-toolkit ftk module system needs to support optional API keys
  - Existing implementation: @upstash/context7-mcp package from npm, currently configured with NO required API key
  - Current implementation: Node.js 18.0.0+ required, uses npx to run the server

  Research Questions:
  1. What are Context7's API authentication methods and how does the optional API key work?
  2. What features and capabilities are available on the free tier (no API key) vs paid tiers?
  3. What are the rate limits, quotas, and pricing structure for different tiers?
  4. What configuration options does the @upstash/context7-mcp npm package support?
  5. What are the token storage requirements and best practices for API key management?
  6. How does Context7 compare feature-wise with competing services (RefTools, etc.)?
  7. What are the technical specifications for integration (endpoints, authentication headers, error handling)?
  8. What are common use cases and when should developers choose Context7 over alternatives?

  Expected Deliverables:
  - Comprehensive authentication workflow documentation (free tier vs API key)
  - Feature comparison matrix between free and paid tiers
  - Rate limits, quotas, and pricing information for all tiers
  - MCP server package configuration options and environment variables
  - Token format, storage requirements, and security best practices
  - Technical integration specifications (API endpoints, headers, error codes)
  - Feature comparison with RefTools and why they are mutually exclusive
  - Recommendations for ftk module system implementation

  Focus Areas:
  - Technical accuracy for MCP server integration (must use official @upstash/context7-mcp package)
  - Authentication workflows and optional API key behavior
  - Community resources and best practices for Context7 usage
  - Module system compatibility and integration patterns
permalink: research/2025-01-13-02-00-00-context7-mcp-server-integration-requirements
tags:
  - research
  - exa
  - context7
  - mcp
  - authentication
---

# Context7 MCP Server Integration Requirements

## Introduction

Context7 is a Model Context Protocol (MCP) server developed by Upstash to inject up-to-date, version-specific code documentation directly into LLM prompts and AI code editors. It is mutually exclusive with services such as RefTools (Ref MCP) due to overlapping functionality and differing design philosophies. This report covers authentication methods, feature tiers, rate limits, npm package configuration, token storage best practices, technical integration specifications, comparisons with competing services, and recommendations for integrating Context7 into the Fluent Toolkit (FTK) module system.

## 1. Authentication Workflow

Context7 supports both unauthenticated (free tier) access and authenticated access via API keys. Unauthenticated clients connect without a key and receive minimal rate limits. Authenticated clients include a bearer token in the HTTP `Authorization` header for higher quotas and private repository access. The workflow is as follows:

Clients obtain an optional API key by signing up at https://context7.com/dashboard ([Context7 Docs](https://context7.com/docs/installation)).

Unauthenticated request example:

```bash
curl "https://context7.com/api/v1/vercel/next.js?tokens=2000"
```

Authenticated request example:

```bash
curl "https://context7.com/api/v1/vercel/next.js?tokens=2000" \
  -H "Authorization: Bearer CONTEXT7_API_KEY"
```

When authenticated, the server enforces rate limits aligned to the client's plan; missing or invalid keys result in HTTP 401 responses ([Context7 API Guide](https://context7.com/docs/api-guide)).

## 2. Feature Comparison: Free vs Paid Tiers

| Feature                 | Free        | Pro ($7/seat/mo)       | Enterprise (Custom) |
| ----------------------- | ----------- | ---------------------- | ------------------- |
| Price                   | $0          | $7 per seat/month      | Custom              |
| Public Repositories     | ✓           | ✓                      | ✓                   |
| Private Repositories    | ✗           | ✓                      | ✓                   |
| Team Collaboration      | ✗           | ✓ (up to 20 members)   | ✓ (unlimited)       |
| API Rate Limit          | 60 req/hour | 60 req/hour per member | Custom              |
| Parse Token Cost        | N/A         | $15 per 1M tokens      | Custom              |
| Access Control          | Basic       | Full                   | Advanced            |
| SOC-2 Compliance        | ✗           | ✗                      | ✓                   |
| SSO (SAML, OAuth, OIDC) | ✗           | ✗                      | ✓                   |
| Support                 | Community   | Email                  | Dedicated           |
| Usage Analytics         | Basic       | ✓                      | Advanced            |
| Custom Rate Limits      | ✗           | ✗                      | ✓                   |
| Priority Features       | ✗           | ✗                      | ✓                   |
| Custom SLA              | ✗           | ✗                      | ✓                   |

Free tier users get access to public documentation with a fixed low rate limit (60 requests/hour). The Pro tier unlocks private repo support, team features, and token-based parsing costs. Enterprise customers can define custom SLAs, rate limits, and compliance requirements ([Context7 Plans & Pricing](https://context7.com/docs/plans-pricing)).

## 3. Rate Limits, Quotas, and Pricing Structure

Rate limits and quotas vary by tier:

- Free: 60 requests/hour per account, public repos only.
- Pro: 60 requests/hour per member plus parse token charges of $15 per 1M tokens for private libraries.
- Enterprise: Custom request quotas and token pricing upon negotiation.

Exceeding rate limits yields HTTP 429 responses with JSON payloads including a `retryAfterSeconds` field indicating cooldown duration ([Context7 API Guide](https://context7.com/docs/api-guide)).

## 4. @upstash/context7-mcp Package Configuration

The `@upstash/context7-mcp` npm package (v1.0.26) serves as the local MCP server. It requires Node.js >=18.0.0. Configuration options include:

- CLI flags: `--api-key <key>` or `--CONTEXT7_API_KEY` env var.
- Environment variables:
  - `CONTEXT7_API_KEY` (optional, string, secret) — when provided, enables authenticated mode with higher quotas and private repo support.

Server manifest (`server.json`) uses stdio transport by default; clients may opt for HTTP transport in remote setups ([Context7 server.json](https://raw.githubusercontent.com/upstash/context7/master/server.json)).

## 5. Token Storage Requirements and Best Practices

API keys must be cryptographically random, encrypted at rest, and rotated periodically. Best practices:

- Store keys in environment variables or secret management systems (e.g., AWS Secrets Manager, Vault).
- Do not commit keys to version control.
- Use distinct keys per environment/project for revocation scope reduction.
- Rotate keys immediately upon suspected compromise.
- Enforce least privilege: limit keys to necessary scopes (public vs private repo access) ([Context7 Security](https://context7.com/docs/security)).

## 6. Comparison with Competing Services (RefTools)

Context7 focuses on injecting entire code docs and examples via MCP directly into LLM contexts, whereas RefTools ("Ref MCP") acts as a search index, returning relevant doc snippets but not code examples. Key distinctions:

- Data Sources: Context7 crawls GitHub docs; RefTools can index arbitrary docs and private sets.
- Token Injection: Context7 injects up to 10k tokens per library by default; RefTools returns compact search results (~2k tokens).
- Pricing: RefTools niche pricing is usage-based; Context7 uses seat-based + token parse fees.
- Team Features: Context7 Pro offers collaborative workspace; RefTools is single-user by design.
- Compliance: Context7 Enterprise supports SOC-2, SSO; RefTools lacks enterprise compliance offerings.

Mutual exclusivity arises as MCP clients can only bind one server per alias, and the user experience differs in prompt syntax and result formatting.

## 7. Technical Integration Specifications

### Endpoints

- REST API: `GET https://context7.com/api/v1/{namespace}/{library}[/{version}]`
  - Query parameters: `tokens`, `topic`.
  - Headers: `Authorization: Bearer {API_KEY}` if authenticated.

- MCP Endpoint: `https://mcp.context7.com/mcp` for HTTP transport.

### Authentication Headers

- Unauthenticated: No header, limited rate.
- Authenticated: `Authorization: Bearer CONTEXT7_API_KEY` ([API Guide](https://context7.com/docs/api-guide)).

### Error Handling

Status codes:

- 200: Success
- 401: Unauthorized (invalid/missing key)
- 404: Not found
- 429: Rate limit exceeded (includes `retryAfterSeconds`)
- 500: Internal error

Error response format:

```json
{ "error": "Error message", "status": 429, "retryAfterSeconds": 60 }
```

## 8. Common Use Cases and Recommendations

Context7 excels when developers need live, version-specific code examples integrated into AI-assisted coding workflows, such as:

- Writing boilerplate for new frameworks (e.g., Next.js middleware).
- Updating legacy code to latest API specs.
- Embedding doc references within AI-driven code reviews.

Choose Context7 over alternatives when private repo access, team collaboration, or compliance (SOC-2, SSO) are required. For single-user snippet search, RefTools may suffice.

### Integration into FTK Module System

Implement MCP server selection abstraction to accept optional `apiKey`. Default to unauthenticated mode. Provide environment variable injection and CLI argument mapping. Include backoff logic for HTTP 429s and warn users about token parse costs on Pro tiers.

## Appendix: References

- Context7 Plans & Pricing ([Context7 Docs](https://context7.com/docs/plans-pricing))
- Context7 API Guide ([Context7 Docs](https://context7.com/docs/api-guide))
- @upstash/context7-mcp server.json manifest ([GitHub](https://raw.githubusercontent.com/upstash/context7/master/server.json))
- Security Best Practices ([Context7 Docs](https://context7.com/docs/security))

## Observations

- [fact] Context7 MCP server provides optional API key authentication with free tier defaulting to 60 requests/hour for public repositories #authentication #rate-limits #free-tier
- [method] Context7 API requests use bearer token authentication implemented via HTTP Authorization header #authentication #http
- [pricing] Context7 Pro tier costs $7 per seat monthly and adds private repository access, team collaboration up to 20 members, and $15 per 1M parse token charges #pricing #pro-tier
- [requirement] Context7 MCP server using stdio transport requires Node.js 18.0.0 or higher as runtime dependency #nodejs #requirements #stdio
- [method] Context7 HTTP 429 rate limit responses include retryAfterSeconds field to enable proper exponential backoff implementation #rate-limits #error-handling
- [fact] Context7 injects up to 10k tokens per library documentation into LLM context by default #context-injection #tokens
- [fact] RefTools and Context7 are mutually exclusive because MCP clients can only bind one server per alias #mcp #exclusivity
- [resource] Context7 package @upstash/context7-mcp version 1.0.26 is the official npm package for MCP server integration #npm #package
- [method] Context7 uses environment variable CONTEXT7_API_KEY to control authenticated vs unauthenticated mode in ftk module configuration #environment-variables #configuration
- [security] Context7 token storage best practices require cryptographically random keys, environment variable storage, periodic rotation, and immediate rotation upon compromise #security #best-practices

## Relations

- requires [[design/ftk-module-system-use-cases]] (module system design requirements)
- contrasts_with [[research/reftools-mcp-integration-requirements]] (mutually exclusive alternative)
- contrasts_with [[research/notion-mcp-server-oauth-authentication-for-ftk-integration]] (uses OAuth instead of API keys)
- pairs_well_with [[research/fire-crawl-mcp-server-integration-research]] (similar API key authentication pattern)
- relates_to [[research/tavali-mcp-server-integration]] (alternative MCP server for ftk)
- documented_in https://context7.com/docs/api-guide (official API documentation)
- documented_in https://context7.com/docs/plans-pricing (pricing tiers and features)
- documented_in https://context7.com/docs/security (security best practices)
- documented_in https://raw.githubusercontent.com/upstash/context7/master/server.json (MCP server manifest)
- documented_in https://www.npmjs.com/package/@upstash/context7-mcp (official npm package)

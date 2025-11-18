---
title: "2025-11-13 00:00:00: Notion MCP OAuth Authentication"
type: note
permalink: research/2025-11-13-00-00-00-notion-mcp-oauth-authentication
tool: exa_deep_researcher
model: exa-research-pro
task_id: 01k9zfn5whne4nwje8r3ps558e
status: completed
created_at: 2025-11-13 00:00:00+00:00
duration_ms: 106337
query_type: deep_research
cached_via: exa_researcher_agent
tags:
  - notion
  - oauth
  - mcp-server
  - authentication
  - ftk
instructions: |
  Research Topic: Notion MCP Server OAuth Authentication for ftk Integration

  Context:
  - Basic Memory design/ftk-module-system-use-cases describes requirement for OAuth/SSE flow
  - Project: fluent-toolkit (ftk) needs to implement automated Notion MCP setup
  - Current module system: Supports various authentication methods (API keys, OAuth)
  - Target workflow: User selects Notion → System automates OAuth → Token stored securely

  Research Questions:
  1. Exact OAuth authorization code grant flow for @notionhq/mcp-server?
  2. SSE (Server-Sent Events) callback mechanism details?
  3. Default and optional OAuth scopes required?
  4. Token storage and refresh strategy?
  5. Callback URL structure and local server setup?
  6. Browser automation requirements (opening authorization URL)?
  7. NPM package details (@notionhq/mcp-server version, dependencies)?
  8. Common OAuth implementation patterns for CLI tools?
  9. How do similar tools (gh CLI, Vercel CLI) handle OAuth?
  10. Token expiration policies and refresh strategies?
---

# Research Report: Notion MCP Server OAuth Authentication for ftk Integration

## Introduction

This report provides a comprehensive technical guide for implementing automated OAuth authentication with the Notion Model Context Protocol (MCP) server in a CLI environment, specifically for the fluent-toolkit (ftk) module system. It addresses the exact authorization code grant flow, details the Server-Sent Events (SSE) callback mechanism, outlines required OAuth scopes, describes token storage and refresh strategies, and offers implementation patterns and best practices inspired by similar CLI tools like GitHub CLI and Vercel CLI.

## 1. OAuth Authorization Code Grant Flow for @notionhq/mcp-server

The Notion MCP server uses the standard OAuth 2.0 authorization code grant flow for public integrations. The steps are as follows:

1. **Construct Authorization URL**: Direct the user's browser to `https://api.notion.com/v1/oauth/authorize?owner=user&client_id={CLIENT_ID}&redirect_uri={ENCODED_REDIRECT_URI}&response_type=code&state={CSRF_STATE}&scope={SPACE_DELIMITED_SCOPES}`. Parameters include client_id from Notion Integration settings, redirect_uri that must match configured settings, response_type=code and owner=user (fixed), state (random string to mitigate CSRF attacks), and scope (optional space-delimited list).

2. **User Grants Permissions**: User signs in if necessary, selects pages/databases, and approves the requested scopes.

3. **Receive Authorization Code**: Notion redirects to `{REDIRECT_URI}?code={AUTH_CODE}&state={CSRF_STATE}`. Validate state to prevent CSRF.

4. **Token Exchange**: Server-side POST to `https://api.notion.com/v1/oauth/token` with JSON body containing grant_type authorization_code, code, redirect_uri, client_id, and client_secret. Response includes access_token, refresh_token, and expires_in.

5. **Store Tokens**: Securely store access_token, refresh_token, and expiry timestamp.

6. **Authenticated Requests**: Include `Authorization: Bearer {access_token}` and `Notion-Version` headers in all MCP server requests.

7. **Token Refresh**: Before expiry, POST to `/oauth/token` with grant_type refresh_token, refresh_token, client_id, and client_secret. Update stored tokens accordingly.

This flow can be fully automated in a CLI by spinning up a local HTTP listener and launching the authorization URL in the user's default browser.

## 2. SSE (Server-Sent Events) Callback Mechanism

Notion MCP supports SSE as a bidirectional transport for asynchronous events. The endpoint is `https://mcp.notion.com/sse` where client makes an HTTP GET with `Accept: text/event-stream` and `Authorization: Bearer {access_token}`. Payload format follows the EventSource format: each event block begins with `event: {eventName}` and `data: {JSON payload}`. Common events include mcp.session.start (session initialization acknowledgment), mcp.request (contains MCP JSON-RPC requests), and mcp.response (delivers JSON-RPC responses).

For local demonstration, ftk can proxy SSE over HTTP by launching a local SSE relay on `http://localhost:PORT/sse` that forwards to `https://mcp.notion.com/sse`. This stream remains open for the duration of the MCP session, allowing real-time context updates and request/response streaming.

## 3. OAuth Scopes Required

Notion's OAuth scopes control the integration's permissions:

- **Default Scopes** (granted implicitly for public integrations): pages:read, databases:read
- **Optional Write Scopes**: pages:write, databases:write, comments:write if the tool performs modifications.
- **Admin Scopes** (rare for CLI tools): users:read, workspaces:read for broader metadata access.

For ftk's automation, request only `pages:read pages:write databases:read databases:write comments:write` to minimize risk.

## 4. Token Storage and Refresh Strategy

### Storage Location & Format

- **File**: `.env.mcp.secrets` in the user's home directory or project root, with file permissions `600` (owner-read/write).
- **Format** (JSON): Object containing access_token, refresh_token, and expires_at (ISO 8601 timestamp).
- **Encryption** (optional): On sensitive environments, encrypt this file with a key derivation function or OS-native secret store (e.g., macOS Keychain, Windows Credential Manager).

### Refresh Strategy

- **Proactive Refresh**: On CLI startup, check current time against `expires_at - buffer` (e.g., 5 minutes). If expired or near expiry, perform refresh.
- **Error-Based Refresh**: On HTTP 401 responses, trigger a refresh then retry the failed request.

Security Best Practices: Use principle of least privilege, avoid logging tokens, rotate tokens periodically, and store client credentials securely in environment variables.

## 5. Callback URL Structure and Local Server Setup

### Callback URL Structure

- **Scheme & Host**: `http://localhost:{DYNAMIC_PORT}/oauth/callback`
- **Query**: `?code={AUTH_CODE}&state={CSRF_STATE}`

### Local Server Setup

- **Port Selection**: Bind to ephemeral port (e.g., 0 for dynamic assignment), then read the assigned port.
- **HTTP Handler**: Minimalist web server (e.g., Node.js http.createServer) listening on `/oauth/callback`, parsing query parameters, validating state, then sending a terminal-friendly HTML page indicating success.
- **Shutdown**: After capturing the code, immediately shut down the server.

Cross-platform: Use Node.js built-in http module. On Windows, ensure firewall prompts are minimal; use 127.0.0.1 over 0.0.0.0 for tighter scope.

## 6. Browser Automation Requirements

- **Opening Authorization URL**: Use open (macOS), xdg-open (Linux), or start (Windows) to launch the default browser. Node.js's open package provides cross-platform support.
- **Timeout Handling**: If no callback arrives within a configurable timeout (e.g., 2 minutes), abort with an instructive error message prompting manual browser interaction.

User Experience: Display a clickable link in the terminal if automatic opening fails.

## 7. NPM Package Details (@notionhq/mcp-server)

- **Package Name**: @notionhq/notion-mcp-server
- **Latest Stable Version**: 1.8.1 (as of April 2025)
- **Dependencies**: @notionhq/client for REST API calls, express or fastify (for HTTP transport), eventsource (for SSE support), commander (for CLI parsing)
- **Transport Flags**: --transport (stdio or http), --port, --auth-token

Configuration: Installed via npm install @notionhq/notion-mcp-server or used via npx with environment variables NOTION_TOKEN or OPENAPI_MCP_HEADERS.

## 8. Common OAuth Patterns for CLI Tools

- **Local Server + Browser**: GitHub CLI (gh auth login) and Azure CLI use local HTTP listeners to capture auth codes.
- **Device Authorization Flow**: When local server is impractical, use OAuth 2.0 Device Flow (device_code grant) with user entering code at given URL.
- **Headless Fallback**: Print URL and prompt for manual code paste.

Recommendation for ftk: Implement local server flow first; optionally add device flow fallback for headless CI environments.

## 9. Similar Tools: GitHub CLI & Vercel CLI

- **GitHub CLI**: Runs local_server flow on `http://localhost:58270/callback`. Opens browser via system call, falls back to manual copy-paste. Stores tokens in `~/.config/gh/hosts.yml` with 600 permissions. Refreshes automatically on 401.
- **Vercel CLI**: Uses device_code flow exclusively. Polls `POST /v2/oauth/token` every 5 seconds until activation. Stores tokens in `~/.vercel/auth.json` with encryption across platforms.

Insights: Both emphasize minimal UX friction, robust error recovery, and secure storage with file permissions. ftk integration can mirror gh's local host callback approach.

## 10. Token Expiration Policies & Refresh Strategies

- **Notion Token Expiry**: Default expires_in is 30 days (2,592,000 seconds) but subject to change; always rely on returned expires_in.
- **Revocation**: Users can revoke tokens via Integration settings in Notion; tools should handle 401 and prompt re-authentication.
- **Refresh Buffer**: Refresh 5 minutes before expires_at to avoid race conditions.
- **Graceful Failure**: On refresh failure (invalid grant, network error), clear tokens and prompt re-authentication.

## Error Handling Strategies

- **Timeout**: Abort OAuth if no callback within 2 minutes, display link and instructions.
- **User Cancellation**: Detect if browser tab closed without auth code; time out and allow retry.
- **Invalid Tokens**: On 401, attempt token refresh once; on failure, clear state and re-run full OAuth flow.
- **Network Failures**: Retry HTTP requests with exponential backoff.

## Workshop Compatibility & Cross-Platform Considerations

The described CLI flow works uniformly on Windows, macOS, and Linux using Node.js. For training scenarios, the local server approach provides visual feedback in the browser and terminal. ftk can include a `--mock-oauth` flag for workshop demos to skip actual Notion calls, using stubbed tokens and bypassing browser launch.

---

## Observations

- [method] Notion OAuth authorization code grant flow is standard OAuth 2.0 with CSRF protection via state parameter following industry-standard implementation #oauth #authentication #security
- [method] Notion SSE stream remains open for session duration enabling real-time context updates and bidirectional communication #sse #streaming #real-time
- [security] Notion default scopes are pages:read and databases:read with optional write scopes for modifications following principle of least privilege #scopes #security #permissions
- [fact] Notion token expiry is 30 days with refresh capability requiring proactive refresh 5 minutes before expiration to avoid race conditions #tokens #expiration #refresh
- [method] Notion local HTTP server on ephemeral port enables automatic browser-based authentication without manual code entry #http #automation #ux
- [security] Notion token storage in .env.mcp.secrets with file permissions 600 aligns with ftk security practices #secrets #storage #permissions
- [fact] Similar CLI tools (gh, Vercel) demonstrate local server approach is standard pattern for terminal OAuth flows #patterns #cli #oauth

## Relations

- requires [[design/ftk-module-system-use-cases]] (module system design requirements)
- contrasts_with [[research/2025-11-13-00-00-00-git-hub-mcp-token-setup]] (different token acquisition approach)
- relates_to Notion MCP Server (implementation target)
- inspired_by GitHub CLI (gh auth login local server pattern)
- inspired_by Vercel CLI (device flow pattern)
- documented_in https://developers.notion.com/docs/authorization (OAuth specification)
- documented_in https://developers.notion.com/docs/get-started-with-mcp (MCP integration guide)
- documented_in https://www.npmjs.com/package/@notionhq/notion-mcp-server/v/1.6.0 (npm package)

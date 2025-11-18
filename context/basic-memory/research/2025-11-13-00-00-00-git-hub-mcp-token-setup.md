---
title: "2025-11-13 00:00:00: GitHub MCP Token Setup"
type: note
permalink: research/2025-11-13-00-00-00-git-hub-mcp-token-setup
tool: exa_deep_researcher
model: exa-research-pro
task_id: 01k9zfmd7dythsk2qvhtzqz9p4
status: completed
created_at: 2025-11-13 00:00:00+00:00
duration_ms: 89985
query_type: deep_research
cached_via: exa_researcher_agent
tags:
  - github
  - mcp-server
  - token-setup
  - authentication
  - ftk
instructions: |
  Research Topic: GitHub MCP Server with CLI-Assisted Token Setup for ftk Integration

  Context:
  - Basic Memory design/ftk-module-system-use-cases - ftk needs intelligent server configuration
  - Project: ftk is a Deno-based MCP server setup toolkit
  - Focus: Token creation workflows that can be automated or guided

  Research Questions:
  1. Official npm package details for @modelcontextprotocol/server-github?
  2. Minimum and recommended GitHub token scopes for MCP server operations?
  3. Token creation capabilities of gh CLI for automation?
  4. Programmatic token creation via gh CLI?
  5. GitHub App authentication support?
  6. Best practices for secure token storage?
  7. Step-by-step manual token creation process?
  8. Rate limits for personal access tokens vs GitHub Apps?
---

# Research Report: GitHub MCP Server with CLI-Assisted Token Setup for ftk Integration

## Overview

This report provides a comprehensive examination of GitHub MCP Server token management workflows, focusing on the @modelcontextprotocol/server-github npm package details, GitHub token scopes, automation via the GitHub CLI (gh), programmatic token creation, GitHub App authentication support, secure token storage practices, manual token creation workflows, and rate limit considerations.

## 1. npm Package Details for @modelcontextprotocol/server-github

The @modelcontextprotocol/server-github package, published on April 8, 2025, at version 2025.4.8, provides a Model Context Protocol (MCP) server implementation for GitHub, enabling file operations, repository and branch management, search across code and issues, issue and PR automation, and batch file operations through a standardized MCP schema. It has 7 dependencies, 13 published versions, and 15 dependent packages. The package is deprecated, with development moved to the GitHub MCP Server repository and a deprecation notice advising migration before November 19, 2025 due to npm token changes.

Key features include automatic branch creation, comprehensive error handling, Git history preservation without force pushes, support for single-file and multi-file operations, and advanced search capabilities. The package README outlines 16 MCP tools such as create_or_update_file, push_files, search_repositories, create_repository, get_file_contents, create_issue, create_pull_request, and various search functions.

## 2. Minimum and Recommended GitHub Token Scopes for MCP Operations

### Classic Personal Access Tokens (PAT)

For classic PATs, broad `repo` scope is required for full read/write access to public and private repository data, including code, statuses, collaborators, deployments, and webhooks; it implicitly includes admin:repo_hook and other sub-scopes. Where least privilege is desired, the following minimal scopes apply: `repo` for full repository access, `workflow` for adding/updating Actions workflow files, and `write:repo_hook` for managing repository webhooks.

Recommended classic PAT scope: `repo`, `workflow`, and `write:repo_hook` to cover MCP file, branch, issue, and webhook operations.

### Fine-Grained Personal Access Tokens

Fine-grained tokens allow selecting specific repositories and permission levels. For MCP use, grant repository permissions: Code (Read & write), Workflows (Read & write), Pull requests (Read & write), Issues (Read & write); Metadata (Read); Actions (Read & write deployments and workflow runs if automating CI/CD).

Justification: MCP tools create/update files, branches, issues, PRs, and may trigger or query workflow runs.

## 3. `gh` CLI Token Creation Capabilities

The GitHub CLI (gh) provides the following token-related commands: `gh auth login` (interactive login with options), `gh auth logout` (revoke CLI authentication), `gh auth status` (display authentication status), and `gh auth refresh` (refresh existing authentication credentials).

For token creation specifically, gh does not provide a dedicated command to generate PATs; however, it can create fine-grained tokens via the gh api command to invoke the REST API.

## 4. Programmatic Token Creation via `gh` CLI

Tokens can be created programmatically using the GitHub REST API for fine-grained PATs or classic PATs (deprecated in CLI). Example using `gh api`: `gh api --method POST /user/fine-grained-tokens -f name="ftk integration token" -f permissions='[{"repository_selection":"all","permissions":{"contents":"write","issues":"write","pull_requests":"write","metadata":"read","workflows":"write"}}]' -f expiration='2026-11-13T00:00:00Z'`.

This command requires the authenticated user to have existing PAT or OAuth token with admin:org or equivalent scope to create tokens. Alternatively, for GitHub Apps, tokens are created via JWT authentication and the `gh auth login --with-jwt` flow, followed by `gh api /app/installations/{installation_id}/access_tokens`.

## 5. GitHub App Authentication Support

The GitHub MCP Server supports GitHub App authentication. In the local server documentation, OAuth mode is configured via MCP host JSON with servers object containing github key configured as type http, URL pointing to https://api.githubcopilot.com/mcp/, and headers with Authorization Bearer token.

For GitHub Apps, users must create a GitHub App in Developer Settings, generate a private key, create a JWT, exchange it for an installation access token, and configure the MCP server's GITHUB_TOKEN environment variable or header input accordingly.

## 6. Secure Token Storage Best Practices

For MCP configurations, tokens should be stored outside source code, such as in encrypted files or environment variables. Best practices include using a `.env.mcp.secrets` file excluded from version control (in .gitignore), employing OS keychains or secret management services (AWS Secrets Manager, HashiCorp Vault), limiting token lifetimes and rotating regularly, encrypting configuration files at rest and decrypting in-memory only at runtime, and applying file permission restrictions (chmod 600 .env.mcp.secrets).

## 7. Manual Token Creation Process (Fallback)

For users without gh CLI: 1. Sign in to GitHub and navigate to Settings > Developer settings > Personal access tokens > Fine-grained tokens. 2. Click Generate new token, name the token (e.g., ftk integration token). 3. Under Repositories, select specific repositories or All repositories. 4. Set permissions: Code (Read & write), Issues (Read & write), Pull requests (Read & write), Workflows (Read & write), Metadata (Read). 5. Optionally set an expiration date. 6. Click Generate token, and copy the token securely. 7. Store token in `.env.mcp.secrets` or secret manager.

For classic PAT fallback: follow same steps under Personal access tokens (classic), granting repo, workflow, and write:repo_hook scopes.

## 8. Rate Limits: Personal Access Tokens vs GitHub Apps

- **PATs**: Authenticated REST API rate limit of 5,000 requests per hour per user token.
- **GitHub Apps**: Installation access tokens inherit the app's rate limit of 5,000 requests per hour per installation.
- **GITHUB_TOKEN** in Actions: 1,000 requests per hour for public repos, 5,000 for private repos.

Recommendation: For high-throughput MCP scenarios, prefer GitHub Apps with multiple installations or scaled installations to avoid hitting user PAT limits. Use exponential backoff when nearing rate limits.

## Integration Patterns and Workshop Exercises

- **Automated Provisioning**: Use gh api in ftk Deno scripts to generate fine-grained PATs during environment bootstrapping, injecting tokens into secure vaults.
- **Guided Setup**: Implement interactive ftk setup token command that prompts users to choose between CLI automation or manual copy-paste, displaying web flow links.
- **Credential Management Workshop**: Exercise attendees create fine-grained PATs manually and via gh, store them in `.env.mcp.secrets`, and configure MCP server JSON, then simulate token rotation.

## Conclusion

This report synthesizes authoritative sources to outline the @modelcontextprotocol/server-github package capabilities, requisite token scopes for secure MCP server operations, CLI and programmatic token generation workflows, GitHub App authentication support, secure token storage practices, manual token creation steps, and rate limit considerations. Integrating these findings into ftk enables robust, secure, and developer-friendly token management for MCP server setups.

---

## Observations

- [fact] GitHub MCP server @modelcontextprotocol/server-github is deprecated with migration required before November 19, 2025 due to npm token changes #deprecated #migration #deadline
- [security] GitHub fine-grained tokens provide superior security through repository and permission-level specificity vs classic PAT broad scopes #security #tokens #permissions
- [method] GitHub CLI (gh api) enables programmatic token creation for CI/CD automation critical for ftk orchestration #cli #automation #ci-cd
- [fact] GitHub rate limits are identical for PATs and GitHub Apps (5,000 requests/hour) but GitHub Apps support multiple installations for scaling #rate-limits #scaling
- [security] GitHub secure token storage requires .env.mcp.secrets file with chmod 600 permissions consistent with ftk security practices #storage #permissions #secrets
- [method] GitHub manual token creation fallback is necessary for users without gh CLI installed ensuring accessibility #fallback #accessibility #ux
- [fact] GitHub CLI both gh auth login and gh api workflows support different token creation scenarios providing flexibility for workshops #workflows #flexibility

## Relations

- contrasts_with [[research/2025-11-13-00-00-00-notion-mcp-oauth-authentication]] (CLI token vs OAuth flow)
- requires [[design/ftk-module-system-use-cases]] (module system design requirements)
- relates_to GitHub MCP Server (implementation target)
- inspired_by GitHub CLI (gh auth login workflow)
- documented_in https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps (OAuth scopes)
- documented_in https://www.npmjs.com/package/@modelcontextprotocol/server-github (npm package)
- documented_in https://github.com/github/github-mcp-server (GitHub repository)

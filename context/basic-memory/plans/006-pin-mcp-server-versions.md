---
title: issue-6-pin-mcp-server-versions
type: note
permalink: plans/issue-6-pin-mcp-server-versions
tags:
  - version-pinning
  - reproducibility
  - mcp-servers
  - issue-6
kind: Plan
created_at: 2024-10-16 00:00:00+00:00
status: active
issue_permalink: https://github.com/Spantree/ftk/issues/6
---

# Issue 6: Pin MCP Server Versions

## ✅ COMPLETED — Phase 1: Infrastructure

- [x] Created lock file system (`mcp.lock.json`)
- [x] Implemented version resolution logic
- [x] Added package registry querying (npm, PyPI)
- [x] Support for version constraints (exact, caret, tilde)

## ✅ COMPLETED — Phase 2: Server Implementation

- [x] Updated BaseMCPServer with version support
- [x] Implemented `resolveVersion()` for npm packages
- [x] Implemented `resolveVersion()` for PyPI packages
- [x] Generate configs with pinned versions

## ⏳ IN PROGRESS — Phase 3: Server Coverage

- [x] Sequential Thinking server (npm)
- [x] Exa server (uvx/PyPI)
- [ ] Verify all servers support version pinning
- [ ] Test version pinning across all server types

## 📌 BACKLOG — Phase 4: Documentation

- [ ] Document version pinning in main README
- [ ] Add version upgrade guide
- [ ] Include troubleshooting for version conflicts
- [ ] Document lock file format

## observations

- [architecture] Lock file stores both constraint and resolved version for reproducibility #version-pinning
- [design-decision] Separate lock file (mcp.lock.json) from config (.mcp.json) for clarity #architecture
- [integration] Package registry queries cached to avoid rate limits #performance
- [limitation] Version resolution requires network access to package registries #offline-support

## relations

- depends-on: [[dynamic-version-resolution]]
- relates-to: [[issue-1-claude-code-installation-and-version-checks]]
- uses-technology: [npm, pypi, semver, uvx]

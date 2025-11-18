---
title: FTK Manual Testing Guide
type: note
permalink: guides/ftk-manual-testing-guide
tags:
  - testing
  - ftk
  - validation
  - qa
  - manual-testing
  - modules
---

# FTK Manual Testing Guide

Comprehensive manual testing procedures for validating ftk functionality, including interactive/non-interactive modes, module management, and conflict detection.

## Setup

```bash
# Ensure ftk is in PATH
export PATH="$HOME/.local/bin:$PATH"
ftk --version  # Should show 0.2.0

# Create test directory
mkdir -p /tmp/ftk-manual-tests
cd /tmp/ftk-manual-tests
```

## Test 1: Non-Interactive Init (--yes)

**Test default modules installation with placeholders**

```bash
# Create fresh test project
mkdir test1-noninteractive && cd test1-noninteractive
git init
echo "# Test Project" > README.md

# Run ftk init with --yes
ftk init --yes --skip-checks

# ✅ Expected Results:
# - Auto-selects 5 default modules (RefTools, Firecrawl, Exa, Sequential, Basic Memory)
# - Creates .env.ftk and .env.ftk.secrets
# - Shows post-install instructions for 3 API keys
# - Creates .mcp.json, CLAUDE.md, .ftk/

# Verify files created
ls -la .mcp.json .env.ftk* CLAUDE.md .ftk/

# Check placeholders in .env.ftk.secrets
cat .env.ftk.secrets
# Should contain: REF_API_KEY, FIRECRAWL_API_KEY, EXA_API_KEY with <your-*> placeholders

# Check .mcp.json has 5 servers
jq '.mcpServers | keys' .mcp.json
# Should show: ["basic-memory", "exa", "firecrawl", "reftools", "sequential"]

# Check CLAUDE.md has @ includes
grep "@.ftk/modules" CLAUDE.md
# Should show 5 @ includes

cd ..
```

## Test 2: Interactive Init

**Test interactive module selection**

```bash
mkdir test2-interactive && cd test2-interactive
git init
echo "# Interactive Test" > README.md

# Run ftk init without --yes
ftk init --skip-checks
# When prompted:
# 1. Select RefTools, Exa, Sequential (skip Firecrawl and Basic Memory)
# 2. Enter test values for REF_API_KEY and EXA_API_KEY
# 3. Accept default context directory name

# ✅ Expected Results:
# - Shows interactive multi-select prompt
# - Prompts for API keys
# - Creates config files
# - Only 3 modules installed

# Verify only 3 servers
jq '.mcpServers | keys' .mcp.json
# Should show: ["exa", "reftools", "sequential"]

cd ..
```

## Test 3: Include/Exclude Flags

**Test modifying default module set**

### 3a. Exclude a default module

```bash
mkdir test3a-exclude && cd test3a-exclude
git init
echo "# Exclude Test" > README.md

# Exclude reftools from defaults
ftk init --exclude reftools --yes --skip-checks

# ✅ Expected Results:
# - Installs 4 modules (all defaults except reftools)
# - No REF_API_KEY in .env.ftk.secrets

# Verify
jq '.mcpServers | keys' .mcp.json
# Should NOT include "reftools"

cd ..
```

### 3b. Include a non-default module

```bash
mkdir test3b-include && cd test3b-include
git init
echo "# Include Test" > README.md

# Add context7 to defaults
ftk init --include context7 --yes --skip-checks

# ⚠️  Expected Results:
# - Shows hard conflict warning: RefTools ↔ Context7
# - Warns but continues because --include was explicit
# - Installs 6 modules (5 defaults + context7)

# Verify both are installed
jq '.mcpServers | keys' .mcp.json | grep -E "(reftools|context7)"
# Should show both

cd ..
```

### 3c. Swap conflicting modules

```bash
mkdir test3c-swap && cd test3c-swap
git init
echo "# Swap Test" > README.md

# Replace reftools with context7
ftk init --exclude reftools --include context7 --yes --skip-checks

# ✅ Expected Results:
# - No conflict warnings (reftools removed before context7 added)
# - 5 modules total (4 defaults + context7)
# - CONTEXT7_API_KEY in env, NOT REF_API_KEY

# Verify
jq '.mcpServers | keys' .mcp.json
# Should include "context7" but NOT "reftools"

cat .env.ftk.secrets
# Should have CONTEXT7_API_KEY placeholder, not REF_API_KEY

cd ..
```

## Test 4: ftk install (Add Module to Existing Project)

**Test adding a module after initialization**

```bash
mkdir test4-install && cd test4-install
git init
echo "# Install Test" > README.md

# Initialize with just 2 modules
ftk init --modules reftools,sequential --yes --skip-checks

# Verify only 2 modules
jq '.mcpServers | keys' .mcp.json
# Should show: ["reftools", "sequential"]

# Now install exa
ftk install exa --yes

# ✅ Expected Results:
# - Prompts for EXA_API_KEY (or uses placeholder in --yes mode)
# - Updates .mcp.json
# - Updates CLAUDE.md with new @ include
# - Caches instruction files to .ftk/modules/exa/

# Verify exa was added
jq '.mcpServers | keys' .mcp.json
# Should show: ["exa", "reftools", "sequential"]

grep "exa" CLAUDE.md
# Should show @ include for exa

# Try installing a conflicting module (context7 conflicts with reftools)
ftk install context7 --yes

# ⚠️  Expected Results:
# - Shows hard conflict warning
# - Asks to proceed anyway (or auto-proceeds with --yes)
# - Installs despite conflict

cd ..
```

## Test 5: ftk remove (Remove Module from Project)

**Test removing an installed module**

```bash
mkdir test5-remove && cd test5-remove
git init
echo "# Remove Test" > README.md

# Initialize with several modules
ftk init --modules reftools,exa,sequential --yes --skip-checks

# Verify 3 modules
jq '.mcpServers | keys' .mcp.json

# Remove exa
ftk remove exa

# ✅ Expected Results:
# - Removes from .mcp.json
# - Removes @ include from CLAUDE.md
# - Removes .ftk/modules/exa/ directory
# - Shows note about env vars not being removed

# Verify exa was removed
jq '.mcpServers | keys' .mcp.json
# Should NOT show "exa"

grep "exa" CLAUDE.md || echo "Exa removed from CLAUDE.md ✓"
# Should not find exa

# But env var still exists
cat .env.ftk.secrets
# Should still have EXA_API_KEY (user needs to clean up manually)

# Try removing non-existent module
ftk remove nonexistent

# ✅ Expected Results:
# - Shows warning that module is not installed
# - Lists currently installed modules

cd ..
```

## Test 6: --modules Flag (Complete Override)

**Test exact module specification**

```bash
mkdir test6-modules && cd test6-modules
git init
echo "# Modules Override Test" > README.md

# Install ONLY context7 and sequential (ignore defaults)
ftk init --modules context7,sequential --yes --skip-checks

# ✅ Expected Results:
# - Installs exactly 2 modules (ignores the 5 defaults)
# - No reftools (even though it's default)

# Verify
jq '.mcpServers | keys' .mcp.json
# Should show: ["context7", "sequential"]

cd ..
```

## Test 7: Conflict Detection Edge Cases

### 7a. Hard conflict without --include (should block)

```bash
mkdir test7a-hard-block && cd test7a-hard-block
git init
echo "# Hard Conflict Block Test" > README.md

# Try to install both reftools and context7 explicitly
ftk init --modules reftools,context7 --yes --skip-checks

# ❌ Expected Results:
# - Detects hard conflict
# - BLOCKS installation
# - Shows error message
# - Exits without creating files

# Verify nothing was created
ls .mcp.json 2>/dev/null && echo "ERROR: Should not create .mcp.json" || echo "✓ Correctly blocked"

cd ..
```

### 7b. Soft conflict (should warn and prompt)

If you create modules with soft conflicts, test interactive prompting:

```bash
# This would work if you had modules with soft conflicts defined
# Example: two web search tools that overlap but don't hard conflict
```

## Test 8: Help and Version Commands

```bash
# Show version
ftk --version
# Should show: ftk 0.2.0

# Show main help
ftk --help
# Should show all commands including install, remove

# Show init help
ftk init --help
# Should show --include and --exclude flags

# Show install help
ftk install --help
# Should show --yes flag

# Show remove help
ftk remove --help
```

## Cleanup

```bash
cd /tmp
rm -rf ftk-manual-tests
```

## Quick Validation Checklist

- [ ] Test 1: `--yes` installs 5 defaults with placeholders
- [ ] Test 2: Interactive selection works
- [ ] Test 3a: `--exclude` removes from defaults
- [ ] Test 3b: `--include` adds to defaults (shows conflict warning)
- [ ] Test 3c: Swap modules cleanly (no conflicts)
- [ ] Test 4: `ftk install` adds module to existing project
- [ ] Test 5: `ftk remove` removes module cleanly
- [ ] Test 6: `--modules` overrides defaults completely
- [ ] Test 7a: Hard conflicts block installation (without --include)
- [ ] Test 8: All help commands work

## Notes

- Use `--skip-checks` to skip Claude Code version checking during tests
- Use `--yes` for non-interactive testing
- Check `.env.ftk.secrets` for placeholder format: `<your-*>`
- Verify `.mcp.json` structure with `jq`
- Check CLAUDE.md for `@.ftk/modules/{id}/{FILE}.md` includes

## Related

- [[basic-memory-note-conventions]] - Conventions for Basic Memory notes
- [[plan-notes-for-complex-tasks]] - Using plan notes for implementation

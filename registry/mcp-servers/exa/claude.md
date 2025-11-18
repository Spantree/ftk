### Exa Research

**Purpose**: AI-powered semantic search, deep research, and comprehensive intelligence gathering.

**When to Use**:

- **Semantic web search**: Technical and business topics with intent understanding
- **Company research**: Business intelligence and organizational profiles
- **Deep research**: Comprehensive multi-source synthesis with AI analysis
- **Professional research**: LinkedIn profiles and organizational intelligence
- **Code discovery**: Technical implementation examples and patterns
- **Content extraction**: Analyze specific web pages with semantic processing

**When NOT to Use**:

- Official documentation available in Context7 (use Context7 first for authority)
- Simple factual lookups
- Exact documentation URL known (use Context7 or Firecrawl if available)

**Tool Selection** (competing tools only):

- **Context7** (if available): Official docs, API refs - use FIRST for technical specs
- **Exa**: Semantic research, business intelligence, comprehensive analysis when Context7 lacks coverage
- **Firecrawl** (if available): Simple page fetching when semantic analysis not needed; Exa for semantic understanding vs Firecrawl for structured scraping

**Available Tools**:

- `web_search_exa` - Semantic web search (understands intent and context)
- `company_research_exa` - Comprehensive business intelligence
- `linkedin_search_exa` - Professional profiles and company pages
- `crawling_exa` - Extract and analyze specific URLs with semantic processing
- `deep_researcher_start` - Start comprehensive AI-powered research (15-45s standard, 45s-2min pro)
- `deep_researcher_check` - Monitor research progress and retrieve results (poll until complete)
- `get_code_context_exa` - Search for code examples and technical patterns

**Examples**:

```
Search for microservices architecture patterns in production systems

Research company: Acme Corp - get business intelligence and market positioning

Find LinkedIn profiles for CTOs in healthcare technology companies

Use deep research to analyze the competitive landscape for API gateway solutions

Look up code examples for OAuth 2.0 implementation with Express.js
```

**Note**: Requires an API key from https://exa.ai

**Deep Research Caching** (CRITICAL for `deep_researcher_*` tools):

Exa Deep Research is expensive to run. **ALWAYS cache raw results to Basic Memory**:

```markdown
---
title: Research Topic Name
type: research
tool: exa_deep_researcher
model: exa-research-pro # or exa-research
task_id: "abc-123-xyz"
date: 2025-01-15
query_type: deep_research
instructions: |
  [PRESERVE EXACT RESEARCH PROMPT HERE]

  Research Topic: [topic]
  Context: [context provided]
  Research Questions:
  1. [question 1]
  2. [question 2]
tags:
  - exa-research
  - research
  - [domain-tags]
---

# Research Title

[PRESERVE COMPLETE EXA RESPONSE HERE - DO NOT SUMMARIZE]

## observations

- [fact] key finding #tag
- [architecture] technical insight #tag

## relations

- relates-to: [[related-note]]
- sources: [url1, url2, url3]
```

**Workflow**:

1. Start research: `deep_researcher_start(instructions, model)`
2. Poll until complete: `deep_researcher_check(taskId)` every 5s
3. **IMMEDIATELY** cache full response in Basic Memory `research/` folder
4. Format with Prettier before writing
5. Include observations and relations sections

**Integration with Other MCPs**:

- Context7 (if available): Check FIRST for official docs, then use Exa for deep research
- Firecrawl (if available): For simple page fetching when semantic analysis not needed
- Basic Memory: **REQUIRED** - cache all deep research results in `research/*.md` with full prompt and response
- Sequential: Synthesize research findings systematically after caching

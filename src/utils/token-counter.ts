/**
 * Token Counting Utilities
 * Estimates token counts for text and MCP tool definitions
 */

import type { MCPToolDefinition } from "../../modules/types.ts";

/**
 * Estimate token count for plain text
 * Uses approximate ratio of 4 characters per token for English text
 * This matches the general GPT tokenization pattern
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // ~4 characters per token is a reasonable approximation
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens for MCP tool definitions
 * Converts tool definitions to JSON and counts tokens
 */
export function estimateMCPToolTokens(tools: MCPToolDefinition[]): number {
  if (!tools || tools.length === 0) return 0;

  // Convert to JSON format as it would appear in MCP context
  const toolsJson = JSON.stringify(tools, null, 2);
  return estimateTokens(toolsJson);
}

/**
 * Estimate tokens for a single MCP tool definition
 */
export function estimateSingleToolTokens(tool: MCPToolDefinition): number {
  const toolJson = JSON.stringify(tool, null, 2);
  return estimateTokens(toolJson);
}

/**
 * Count tokens in a file
 */
export async function countFileTokens(filePath: string): Promise<number> {
  try {
    const content = await Deno.readTextFile(filePath);
    return estimateTokens(content);
  } catch (error) {
    console.warn(
      `[tokens] Failed to read file ${filePath}:`,
      error instanceof Error ? error.message : String(error),
    );
    return 0;
  }
}

/**
 * Get token breakdown for multiple text sources
 */
export interface TokenBreakdown {
  sources: Map<string, number>;
  total: number;
}

export function createTokenBreakdown(
  sources: Record<string, string>,
): TokenBreakdown {
  const sourcesMap = new Map<string, number>();
  let total = 0;

  for (const [name, text] of Object.entries(sources)) {
    const tokens = estimateTokens(text);
    sourcesMap.set(name, tokens);
    total += tokens;
  }

  return { sources: sourcesMap, total };
}

/**
 * Format token count for display
 */
export function formatTokenCount(count: number): string {
  if (count === 0) return "0 tokens";
  if (count < 1000) return `${count} tokens`;
  return `${(count / 1000).toFixed(1)}K tokens`;
}

/**
 * Calculate percentage of context window used
 */
export function calculateContextPercentage(
  tokenCount: number,
  maxContext: number = 200_000, // Claude Sonnet 4.5 default
): string {
  const percentage = (tokenCount / maxContext) * 100;
  return `${percentage.toFixed(1)}%`;
}

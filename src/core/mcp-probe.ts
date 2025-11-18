/**
 * MCP Server Probing
 * Spawns MCP servers to query available tools and calculate exact token counts
 */

import type { MCPToolDefinition, Module, ProbeResult } from "../../modules/types.ts";
import { estimateMCPToolTokens } from "../utils/token-counter.ts";

/**
 * JSON-RPC request/response types
 */
interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * Probe an MCP server to get tool definitions
 * Spawns the server, sends initialize and tools/list requests, then shuts down
 */
export async function probeMCPServer(
  module: Module,
  env?: Record<string, string>,
): Promise<ProbeResult> {
  const timeout = module.metadata.probing?.timeout_ms || 5000;

  try {
    // Spawn MCP server subprocess (stdio transport)
    const command = module.metadata.mcp?.command;
    const args = module.metadata.mcp?.args;

    if (!command || !args) {
      return {
        success: false,
        tools: [],
        mcpTokens: 0,
        error: "No MCP command configuration found",
      };
    }

    const process = new Deno.Command(command, {
      args,
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
      env: { ...Deno.env.toObject(), ...module.metadata.mcp?.env, ...env },
    }).spawn();

    const stdin = process.stdin.getWriter();
    const stdout = process.stdout;

    // Set timeout for entire probe operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // 1. Send initialize request
      const initRequest: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "ftk-probe",
            version: "1.0.0",
          },
        },
      };

      await sendRequest(stdin, initRequest);
      const initResponse = await readResponse(stdout, controller.signal);

      if (initResponse.error) {
        throw new Error(
          `Initialize failed: ${initResponse.error.message}`,
        );
      }

      // 2. Send tools/list request
      const toolsRequest: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      };

      await sendRequest(stdin, toolsRequest);
      const toolsResponse = await readResponse(stdout, controller.signal);

      if (toolsResponse.error) {
        throw new Error(
          `Tools list failed: ${toolsResponse.error.message}`,
        );
      }

      // 3. Parse tool definitions
      const tools = ((toolsResponse.result as { tools?: MCPToolDefinition[] })?.tools ||
        []) as MCPToolDefinition[];

      // 4. Calculate token count
      const mcpTokens = estimateMCPToolTokens(tools);

      // 5. Send shutdown notification
      const shutdownRequest: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: 3,
        method: "shutdown",
      };
      await sendRequest(stdin, shutdownRequest);

      // Close stdin to signal end of communication
      await stdin.close();

      // Wait for process to exit
      await process.status;

      clearTimeout(timeoutId);

      return {
        success: true,
        tools,
        mcpTokens,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Kill the process if still running
      try {
        process.kill("SIGTERM");
      } catch {
        // Already dead
      }

      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          tools: [],
          mcpTokens: 0,
          error: `Probe timeout after ${timeout}ms`,
        };
      }

      return {
        success: false,
        tools: [],
        mcpTokens: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  } catch (error) {
    return {
      success: false,
      tools: [],
      mcpTokens: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send a JSON-RPC request to stdin
 */
async function sendRequest(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  request: JSONRPCRequest,
): Promise<void> {
  const json = JSON.stringify(request);
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(json + "\n"));
}

/**
 * Read a JSON-RPC response from stdout
 * Reads lines until a valid JSON-RPC response is found
 */
async function readResponse(
  stdout: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): Promise<JSONRPCResponse> {
  const reader = stdout.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const { value, done } = await reader.read();

      if (done) {
        throw new Error("Stream closed before receiving response");
      }

      buffer += decoder.decode(value, { stream: true });

      // Try to parse each line as JSON-RPC
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const response = JSON.parse(trimmed) as JSONRPCResponse;
          if (response.jsonrpc === "2.0" && response.id !== undefined) {
            reader.releaseLock();
            return response;
          }
        } catch {
          // Not valid JSON, continue reading
        }
      }
    }
  } catch (error) {
    reader.releaseLock();
    throw error;
  }
}

/**
 * Check if a module can be probed
 */
export function canProbeModule(module: Module): boolean {
  // Must have MCP capability
  if (!module.metadata.capabilities.includes("MCP")) {
    return false;
  }

  // Must have probing enabled
  if (!module.metadata.probing?.enabled) {
    return false;
  }

  // Must have command configuration
  if (!module.metadata.mcp?.command || !module.metadata.mcp?.args) {
    return false;
  }

  return true;
}

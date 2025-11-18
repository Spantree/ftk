/**
 * MCP Server Registry
 * Manages the modular registry of available MCP servers
 *
 * Migration Strategy:
 * - New modules/ directory: TypeScript-only module definitions
 * - Old registry/ directory: Legacy TypeScript modules (deprecated)
 * - ServerRegistry checks modules/ first, falls back to registry/
 */

import type { MCPServerModule } from "../types/lifecycle.ts";
import { loadModules } from "../../modules/index.ts";
import type { Module } from "../../modules/types.ts";
import { moduleIdToFilename } from "./module-cache.ts";

/**
 * Instruction ordering based on dependencies
 * Modules that are referenced by others should come first
 */
const INSTRUCTION_ORDER = [
  "basic-memory",   // Foundation - other tools cache here
  "sequential",     // Reasoning - references basic-memory
  "serena",         // Development tools - references basic-memory
  "reftools",       // Code docs - references basic-memory
  "context7",       // Alternative code docs
  "exa",            // AI search - references sequential + basic-memory
  "firecrawl",      // Web scraping
];

/**
 * Cache for loaded modules
 */
let modulesCache: Map<string, Module> | null = null;

/**
 * Sort modules by instruction order
 * Ensures dependencies are loaded first in CLAUDE.md
 */
function sortByInstructionOrder(modules: Module[]): Module[] {
  return modules.sort((a, b) => {
    const aIndex = INSTRUCTION_ORDER.indexOf(a.metadata.id);
    const bIndex = INSTRUCTION_ORDER.indexOf(b.metadata.id);

    // If not in order list, put at end
    const aPos = aIndex === -1 ? INSTRUCTION_ORDER.length : aIndex;
    const bPos = bIndex === -1 ? INSTRUCTION_ORDER.length : bIndex;

    return aPos - bPos;
  });
}

export class ServerRegistry {
  /**
   * Load modules from modules/ directory (cached)
   */
  private static async getModules(): Promise<Map<string, Module>> {
    if (!modulesCache) {
      modulesCache = await loadModules();
    }
    return modulesCache;
  }

  /**
   * Convert a Module to MCPServerModule (legacy format)
   */
  private static moduleToServerModule(
    module: Module,
  ): MCPServerModule {
    // Generate @ includes for each instruction file (flat structure)
    // Auto-generate filename from module ID if not provided
    const claudeIncludes = module.instructions
      .map(({ filename }) => {
        const actualFilename = filename ?? moduleIdToFilename(module.metadata.id);
        return `@.ftk/instructions/${actualFilename}`;
      })
      .join("\n");

    // Helper to transform LifecycleContext to ModuleContext
    // deno-lint-ignore no-explicit-any
    const transformContext = (lifecycleCtx: any) => ({
      metadata: module.metadata,
      projectDir: lifecycleCtx.getProjectPath(),
      config: new Map<string, unknown>(),
      log: {
        info: (msg: string) => lifecycleCtx.info(msg),
        warn: (msg: string) => lifecycleCtx.warning(msg),
        error: (msg: string) => lifecycleCtx.error(msg),
        debug: (msg: string) => console.debug(msg),
      },
    });

    return {
      metadata: {
        id: module.metadata.id,
        name: module.metadata.name,
        description: module.metadata.description,
        category: "optional" as const, // Default to optional for now
      },
      // Lifecycle methods from module.ts with context transformation
      precheck: module.hooks?.precheck
        // deno-lint-ignore no-explicit-any
        ? (ctx: any) => module.hooks!.precheck!(transformContext(ctx))
        : () => Promise.resolve({ success: true }),
      configure: module.hooks?.configure
        // deno-lint-ignore no-explicit-any
        ? (ctx: any) => module.hooks!.configure!(transformContext(ctx))
        : () => Promise.resolve({ success: true }),
      install: module.hooks?.install
        // deno-lint-ignore no-explicit-any
        ? (ctx: any) => module.hooks!.install!(transformContext(ctx))
        : () =>
          Promise.resolve({
            success: true,
            mcpConfig: {
              command: module.metadata.mcp?.command || "echo",
              args: module.metadata.mcp?.args || [],
              env: module.metadata.mcp?.env || {},
            },
          }),
      validate: module.hooks?.validate
        // deno-lint-ignore no-explicit-any
        ? (ctx: any) => module.hooks!.validate!(transformContext(ctx))
        : () => Promise.resolve({ success: true }),
      // Legacy interface methods
      getClaudeMdContent: () => claudeIncludes,
      getDisplayInfo: () => ({
        name: module.metadata.name,
        description: module.metadata.description,
        recommended: false, // TODO: Add tier field to module.yaml
      }),
      getSecrets: () => [], // Modules don't expose secrets directly
    };
  }

  /**
   * Get all available MCP servers (modules/ only, legacy registry disabled)
   * Sorted by instruction order to respect dependencies
   */
  static async getAll(): Promise<MCPServerModule[]> {
    const modules = await ServerRegistry.getModules();
    const sortedModules = sortByInstructionOrder(Array.from(modules.values()));
    const moduleServers = sortedModules.map((m) =>
      ServerRegistry.moduleToServerModule(m)
    );

    // Legacy registry disabled - only return module-based servers
    return moduleServers;
  }

  /**
   * Get a specific server by ID (modules/ only, legacy registry disabled)
   */
  static async getById(id: string): Promise<MCPServerModule | undefined> {
    // Check modules/ only
    const modules = await ServerRegistry.getModules();
    const module = modules.get(id);
    if (module) {
      return ServerRegistry.moduleToServerModule(module);
    }

    // Legacy registry disabled
    return undefined;
  }

  /**
   * Get all default servers (tier: default in module.yaml)
   * Sorted by instruction order to respect dependencies
   */
  static async getCore(): Promise<MCPServerModule[]> {
    const modules = await ServerRegistry.getModules();
    const defaultModules = Array.from(modules.values()).filter(
      (m) => m.metadata.tier === "default",
    );
    const sortedModules = sortByInstructionOrder(defaultModules);
    return sortedModules.map((m) => ServerRegistry.moduleToServerModule(m));
  }

  /**
   * Get all optional servers
   * Sorted by instruction order to respect dependencies
   */
  static async getOptional(): Promise<MCPServerModule[]> {
    const modules = await ServerRegistry.getModules();
    const sortedModules = sortByInstructionOrder(Array.from(modules.values()));
    const moduleServers = sortedModules.map((m) =>
      ServerRegistry.moduleToServerModule(m)
    );

    // Legacy registry disabled - only return module-based servers
    return moduleServers;
  }

  /**
   * Get servers by category
   */
  static getByCategory(
    category: "core" | "optional",
  ): Promise<MCPServerModule[]> {
    if (category === "core") {
      return ServerRegistry.getCore();
    } else {
      return ServerRegistry.getOptional();
    }
  }

  /**
   * Get all server IDs (modules/ only, legacy registry disabled)
   */
  static async getIds(): Promise<string[]> {
    const modules = await ServerRegistry.getModules();
    const moduleIds = Array.from(modules.keys());
    // Legacy registry disabled - only return module IDs
    return moduleIds;
  }

  /**
   * Get original Module by ID (only for new modules, not legacy)
   * Returns undefined for legacy registry servers
   */
  static async getModuleById(id: string): Promise<Module | undefined> {
    const modules = await ServerRegistry.getModules();
    return modules.get(id);
  }

  /**
   * Clear module cache (useful for testing or hot-reload)
   */
  static clearCache(): void {
    modulesCache = null;
  }
}

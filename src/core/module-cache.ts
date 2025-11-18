/**
 * Module Cache Manager
 * Handles .ftk/ cache structure:
 * - .ftk/modules/{id}/metadata.json - Token counts and tool definitions
 * - .ftk/instructions/{filename} - Instruction content (flat structure)
 */

import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import type {
  CachedMetadata,
  InstructionContent,
  InstructionContext,
  Module,
} from "../../modules/types.ts";

/**
 * Convert module ID to SCREAMING_SNAKE_CASE filename
 * Example: "basic-memory" → "BASIC_MEMORY.md"
 */
export function moduleIdToFilename(moduleId: string): string {
  return moduleId.toUpperCase().replace(/-/g, "_") + ".md";
}

/**
 * Resolve instruction content (static string or dynamic function)
 */
function resolveInstructionContent(
  content: InstructionContent,
  ctx: InstructionContext,
): string {
  return typeof content === "function" ? content(ctx) : content;
}

/**
 * Get the .ftk/modules/{id}/ directory path for a module (metadata only)
 */
export function getModuleCacheDir(projectDir: string, moduleId: string): string {
  return join(projectDir, ".ftk", "modules", moduleId);
}

/**
 * Get the .ftk/instructions/ directory path (all instruction files)
 */
export function getInstructionsDir(projectDir: string): string {
  return join(projectDir, ".ftk", "instructions");
}

/**
 * Get the metadata.json path for a module
 */
export function getMetadataPath(projectDir: string, moduleId: string): string {
  return join(getModuleCacheDir(projectDir, moduleId), "metadata.json");
}

/**
 * Get the path for a cached instruction file
 */
export function getCachedInstructionPath(
  projectDir: string,
  _moduleId: string,
  filename: string,
): string {
  return join(getInstructionsDir(projectDir), filename);
}

/**
 * Load cached metadata for a module
 * Returns null if cache doesn't exist or is invalid
 */
export async function loadCachedMetadata(
  projectDir: string,
  moduleId: string,
): Promise<CachedMetadata | null> {
  try {
    const metadataPath = getMetadataPath(projectDir, moduleId);
    const content = await Deno.readTextFile(metadataPath);
    const metadata = JSON.parse(content) as CachedMetadata;

    // Basic validation
    if (metadata.moduleId !== moduleId) {
      console.warn(
        `[cache] Module ID mismatch: expected ${moduleId}, got ${metadata.moduleId}`,
      );
      return null;
    }

    return metadata;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null; // Cache doesn't exist yet
    }
    console.warn(
      `[cache] Failed to load metadata for ${moduleId}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Save cached metadata for a module
 */
export async function saveCachedMetadata(
  projectDir: string,
  metadata: CachedMetadata,
): Promise<void> {
  const cacheDir = getModuleCacheDir(projectDir, metadata.moduleId);
  await ensureDir(cacheDir);

  const metadataPath = getMetadataPath(projectDir, metadata.moduleId);
  await Deno.writeTextFile(
    metadataPath,
    JSON.stringify(metadata, null, 2),
  );
}

/**
 * Write all instruction content from module to .ftk/instructions/
 * Resolves polymorphic instruction content based on installed modules
 */
export async function cacheInstructions(
  projectDir: string,
  module: Module,
  installedModuleIds: string[],
): Promise<void> {
  const instructionsDir = getInstructionsDir(projectDir);
  await ensureDir(instructionsDir);

  const ctx: InstructionContext = { installedModules: installedModuleIds };

  // Write each instruction file to flat instructions directory
  for (const instruction of module.instructions) {
    // Auto-generate filename if not provided
    const filename = instruction.filename ?? moduleIdToFilename(module.metadata.id);
    const content = resolveInstructionContent(instruction.content, ctx);

    const cachedPath = getCachedInstructionPath(
      projectDir,
      module.metadata.id,
      filename,
    );
    await Deno.writeTextFile(cachedPath, content);
  }
}

/**
 * Check if cached metadata is still valid
 * Returns true if cache exists and is up to date
 */
export async function isCacheValid(
  projectDir: string,
  module: Module,
): Promise<boolean> {
  const cached = await loadCachedMetadata(projectDir, module.metadata.id);
  if (!cached) {
    return false;
  }

  // Check if version matches (if available)
  if (module.metadata.installation.package && cached.version) {
    // TODO: Could check actual installed package version here
    // For now, trust the cache if version exists
  }

  // Check if all instruction files exist in cache
  for (const instruction of module.instructions) {
    try {
      // Auto-generate filename if not provided
      const filename = instruction.filename ?? moduleIdToFilename(module.metadata.id);
      const cachedPath = getCachedInstructionPath(
        projectDir,
        module.metadata.id,
        filename,
      );
      await Deno.stat(cachedPath);
    } catch {
      // If cached file doesn't exist, cache is invalid
      return false;
    }
  }

  return true;
}

/**
 * Clear cache for a specific module
 */
export async function clearModuleCache(
  projectDir: string,
  moduleId: string,
): Promise<void> {
  const cacheDir = getModuleCacheDir(projectDir, moduleId);
  try {
    await Deno.remove(cacheDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

/**
 * Clear all module caches
 */
export async function clearAllCaches(projectDir: string): Promise<void> {
  const modulesDir = join(projectDir, ".ftk", "modules");
  try {
    await Deno.remove(modulesDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

/**
 * Get or create cached metadata with current timestamp
 */
export async function getOrCreateCachedMetadata(
  projectDir: string,
  moduleId: string,
  version?: string,
): Promise<CachedMetadata> {
  const cached = await loadCachedMetadata(projectDir, moduleId);
  if (cached) {
    return cached;
  }

  // Create new cached metadata with zero tokens
  return {
    moduleId,
    version,
    cached: {
      mcpTokens: 0,
      instructionsTokens: 0,
      totalTokens: 0,
      calculatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Update cached metadata with new token counts
 */
export async function updateCachedTokens(
  projectDir: string,
  moduleId: string,
  mcpTokens: number,
  instructionsTokens: number,
  tools?: CachedMetadata["tools"],
  version?: string,
): Promise<void> {
  const metadata: CachedMetadata = {
    moduleId,
    version,
    cached: {
      mcpTokens,
      instructionsTokens,
      totalTokens: mcpTokens + instructionsTokens,
      calculatedAt: new Date().toISOString(),
    },
    tools,
  };

  await saveCachedMetadata(projectDir, metadata);
}

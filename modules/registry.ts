/**
 * Static module registry
 * All modules are explicitly imported here so they embed properly in compiled binaries
 */

import type { Module } from "./types.ts";
import { module as sequential } from "./sequential/index.ts";
import { module as basicMemory } from "./basic-memory/index.ts";
import { module as exa } from "./exa/index.ts";
import { module as firecrawl } from "./firecrawl/index.ts";
import { module as reftools } from "./reftools/index.ts";
import { module as context7 } from "./context7/index.ts";
import { module as serena } from "./serena/index.ts";

/**
 * Registry of all available modules
 * Add new modules to this map as they're created
 */
const MODULES = new Map<string, Module>([
  ["sequential", sequential],
  ["basic-memory", basicMemory],
  ["exa", exa],
  ["firecrawl", firecrawl],
  ["reftools", reftools],
  ["context7", context7],
  ["serena", serena],
]);

/**
 * Get all modules
 */
export function getAllModules(): Map<string, Module> {
  return MODULES;
}

/**
 * Get a single module by ID
 */
export function getModule(id: string): Module | undefined {
  return MODULES.get(id);
}

/**
 * Get all module IDs
 */
export function getModuleIds(): string[] {
  return Array.from(MODULES.keys());
}

/**
 * Get modules by category
 */
export function getModulesByCategory(category: string): Module[] {
  return Array.from(MODULES.values()).filter(
    (m) => m.metadata.category === category,
  );
}

/**
 * Get default modules (tier: default)
 */
export function getDefaultModules(): Module[] {
  return Array.from(MODULES.values()).filter(
    (m) => m.metadata.tier === "default",
  );
}

/**
 * Check if two modules have conflicts
 */
export function hasConflict(
  module1: Module,
  module2: Module,
): { hard: boolean; soft: boolean } {
  const hard = module1.metadata.conflicts?.hard?.includes(module2.metadata.id) ||
    module2.metadata.conflicts?.hard?.includes(module1.metadata.id) ||
    false;

  const soft = module1.metadata.conflicts?.soft?.includes(module2.metadata.id) ||
    module2.metadata.conflicts?.soft?.includes(module1.metadata.id) ||
    false;

  return { hard, soft };
}

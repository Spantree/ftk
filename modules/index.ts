/**
 * Module exports
 * Re-export from static registry for backward compatibility
 */

export * from "./types.ts";
export {
  getAllModules as loadModules,
  getDefaultModules,
  getModule,
  getModulesByCategory,
  hasConflict,
} from "./registry.ts";

// For backward compatibility with old API
export async function getModulesByCapability(capability: string) {
  const { getAllModules } = await import("./registry.ts");
  const modules = getAllModules();
  return Array.from(modules.values()).filter((m) => m.metadata.capabilities.includes(capability));
}

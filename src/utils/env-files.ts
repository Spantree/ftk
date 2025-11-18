/**
 * Utilities for managing .env.ftk and .env.ftk.secrets files
 */

import {
  parse as parseEnv,
  stringify as stringifyEnv,
} from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";
import type { EnvVar } from "../../modules/types.ts";

/**
 * Read environment variables from a dotenv file
 */
export async function readEnvFile(path: string): Promise<Record<string, string>> {
  try {
    if (!await exists(path)) {
      return {};
    }
    const content = await Deno.readTextFile(path);
    return parseEnv(content);
  } catch (error) {
    console.warn(`Failed to read ${path}:`, error instanceof Error ? error.message : String(error));
    return {};
  }
}

/**
 * Write environment variables to a dotenv file
 */
export async function writeEnvFile(path: string, vars: Record<string, string>): Promise<void> {
  const content = stringifyEnv(vars);
  await Deno.writeTextFile(path, content);
}

/**
 * Merge new env vars into existing file, preserving other vars
 */
export async function mergeEnvFile(path: string, newVars: Record<string, string>): Promise<void> {
  const existing = await readEnvFile(path);
  const merged = { ...existing, ...newVars };
  await writeEnvFile(path, merged);
}

/**
 * Get environment variables for a specific server from env files
 * Reads both .env.ftk and .env.ftk.secrets and filters to only the vars declared in envVars
 */
export async function getServerEnvVars(
  projectDir: string,
  envVars?: EnvVar[],
): Promise<Record<string, string>> {
  if (!envVars || envVars.length === 0) {
    return {};
  }

  // Read both env files
  const nonSecrets = await readEnvFile(`${projectDir}/.env.ftk`);
  const secrets = await readEnvFile(`${projectDir}/.env.ftk.secrets`);
  const allEnv = { ...nonSecrets, ...secrets };

  // Filter to only the vars this server declares
  const serverEnv: Record<string, string> = {};
  for (const envVar of envVars) {
    if (allEnv[envVar.name] !== undefined) {
      serverEnv[envVar.name] = allEnv[envVar.name];
    }
  }

  return serverEnv;
}

/**
 * Split env vars into secrets and non-secrets based on env_vars declarations
 */
export function splitSecrets(
  vars: Record<string, string>,
  envVars: EnvVar[],
): { secrets: Record<string, string>; nonSecrets: Record<string, string> } {
  const secrets: Record<string, string> = {};
  const nonSecrets: Record<string, string> = {};

  for (const [key, value] of Object.entries(vars)) {
    const declaration = envVars.find((ev) => ev.name === key);
    if (declaration?.secret) {
      secrets[key] = value;
    } else {
      nonSecrets[key] = value;
    }
  }

  return { secrets, nonSecrets };
}

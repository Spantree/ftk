/**
 * Helper functions for collecting environment variables during init
 */

import type { EnvVar } from "../../../modules/types.ts";
import { buildBaseEnv } from "../../../modules/types.ts";
import { Prompts } from "../../ui/prompts.ts";
import { Input } from "@cliffy/prompt";
import { join } from "@std/path";
import { parse } from "@std/dotenv";

/**
 * Result of collecting environment variables
 */
export interface EnvCollectionResult {
  secrets: Record<string, string>;
  nonSecrets: Record<string, string>;
  /** Variables that were written as placeholders and need user input */
  needsUserInput: Array<{
    name: string;
    description: string;
    secret: boolean;
  }>;
}

/**
 * Collect environment variable values from user
 * Shows defaults and determines which are secrets
 * Checks existing env files first and only prompts for missing values
 */
export async function collectEnvVars(
  serverName: string,
  envVars?: EnvVar[],
  nonInteractive = false,
  projectDir: string = Deno.cwd(),
): Promise<EnvCollectionResult> {
  const secrets: Record<string, string> = {};
  const nonSecrets: Record<string, string> = {};
  const needsUserInput: Array<{ name: string; description: string; secret: boolean }> = [];

  if (!envVars || envVars.length === 0) {
    return { secrets, nonSecrets, needsUserInput };
  }

  // Build base env from defaults
  const baseEnv = buildBaseEnv(envVars);

  // Read existing env files
  const envFtkPath = join(projectDir, ".env.ftk");
  const envSecretsPath = join(projectDir, ".env.ftk.secrets");

  let existingEnv: Record<string, string> = {};
  let existingSecrets: Record<string, string> = {};

  try {
    const content = await Deno.readTextFile(envFtkPath);
    existingEnv = parse(content);
  } catch {
    // File doesn't exist or can't be read
  }

  try {
    const content = await Deno.readTextFile(envSecretsPath);
    existingSecrets = parse(content);
  } catch {
    // File doesn't exist or can't be read
  }

  console.log(`\nEnvironment variables for ${serverName}:`);

  for (const envVar of envVars) {
    // Check if value already exists in env files
    const existingValue = envVar.secret ? existingSecrets[envVar.name] : existingEnv[envVar.name];

    if (
      existingValue && existingValue !== `<your-${envVar.name.toLowerCase().replace(/_/g, "-")}>`
    ) {
      // Value already exists and is not a placeholder - reuse it
      if (envVar.secret) {
        secrets[envVar.name] = existingValue;
      } else {
        nonSecrets[envVar.name] = existingValue;
      }
      continue;
    }

    const hasDefault = baseEnv[envVar.name] !== undefined;
    const defaultValue = baseEnv[envVar.name];

    if (nonInteractive) {
      // Use defaults, or write placeholders for required vars
      if (hasDefault) {
        if (envVar.secret) {
          secrets[envVar.name] = defaultValue;
        } else {
          nonSecrets[envVar.name] = defaultValue;
        }
      } else if (envVar.required) {
        // Write placeholder and track for user instructions
        const placeholder = `<your-${envVar.name.toLowerCase().replace(/_/g, "-")}>`;
        if (envVar.secret) {
          secrets[envVar.name] = placeholder;
        } else {
          nonSecrets[envVar.name] = placeholder;
        }
        needsUserInput.push({
          name: envVar.name,
          description: envVar.description,
          secret: envVar.secret,
        });
      }
      continue;
    }

    // Interactive prompt
    let prompt = `${envVar.name}`;
    if (envVar.description) {
      prompt += ` (${envVar.description})`;
    }

    const value = await Input.prompt({
      message: prompt,
      default: defaultValue,
      hint: envVar.secret ? "secret - will be stored in .env.ftk.secrets" : undefined,
    });

    if (value) {
      if (envVar.secret) {
        secrets[envVar.name] = value;
      } else {
        nonSecrets[envVar.name] = value;
      }
    } else if (envVar.required) {
      Prompts.warning(`Required env var ${envVar.name} not provided`);
    }
  }

  return { secrets, nonSecrets, needsUserInput };
}

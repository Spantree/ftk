/**
 * Lock File Utilities Tests
 */

import { assertEquals, assertExists } from "@std/assert";
import { join } from "@std/path";
import {
  getServerLock,
  readLockFile,
  removeServerLock,
  updateServerLock,
  writeLockFile,
} from "./lockfile.ts";
import type { FtkLockFile, McpServerLock } from "../types/lockfile.ts";
import { createDefaultLockFile } from "../types/lockfile.ts";

// Test helpers
async function createTempDir(): Promise<string> {
  const tempDir = await Deno.makeTempDir({ prefix: "ftk_test_" });
  return tempDir;
}

async function cleanup(dir: string): Promise<void> {
  try {
    await Deno.remove(dir, { recursive: true });
  } catch {
    // Ignore errors during cleanup
  }
}

Deno.test("readLockFile - creates default lock file if not found", async () => {
  const tempDir = await createTempDir();

  try {
    const lockFile = await readLockFile(tempDir);

    assertExists(lockFile);
    assertEquals(lockFile.version, "1.0.0");
    assertExists(lockFile.updated);
    assertEquals(lockFile.mcpServers, {});
  } finally {
    await cleanup(tempDir);
  }
});

Deno.test("writeLockFile - writes valid YAML lock file", async () => {
  const tempDir = await createTempDir();

  try {
    const lockFile: FtkLockFile = {
      version: "1.0.0",
      updated: new Date().toISOString(),
      mcpServers: {
        "test-server": {
          packageName: "@test/package",
          registry: "npm",
          packageConstraint: "^1.0.0",
          packageResolution: "1.2.3",
        },
      },
    };

    await writeLockFile(tempDir, lockFile);

    // Verify file was written with snake_case YAML
    const lockFilePath = join(tempDir, ".ftk-lock.yaml");
    const content = await Deno.readTextFile(lockFilePath);

    assertExists(content);
    assertEquals(content.includes("version:"), true);
    assertEquals(content.includes("mcpServers:"), true);
    assertEquals(content.includes("test-server:"), true);
    assertEquals(content.includes("package_name:"), true);
    assertEquals(content.includes("package_constraint:"), true);
    assertEquals(content.includes("package_resolution:"), true);
  } finally {
    await cleanup(tempDir);
  }
});

Deno.test("writeLockFile - updates timestamp", async () => {
  const tempDir = await createTempDir();

  try {
    const lockFile: FtkLockFile = {
      version: "1.0.0",
      updated: "2024-01-01T00:00:00.000Z",
      mcpServers: {},
    };

    await writeLockFile(tempDir, lockFile);

    // Read back and verify timestamp was updated
    const readBack = await readLockFile(tempDir);
    assertEquals(readBack.updated !== "2024-01-01T00:00:00.000Z", true);
  } finally {
    await cleanup(tempDir);
  }
});

Deno.test("updateServerLock - adds new server entry", () => {
  const lockFile = createDefaultLockFile();

  const serverLock: McpServerLock = {
    packageName: "@test/package",
    registry: "npm",
    packageConstraint: "^1.0.0",
    packageResolution: "1.2.3",
  };

  const updated = updateServerLock(lockFile, "test-server", serverLock);

  assertExists(updated.mcpServers["test-server"]);
  assertEquals(updated.mcpServers["test-server"].packageName, "@test/package");
  assertEquals(updated.mcpServers["test-server"].packageResolution, "1.2.3");
  assertExists(updated.mcpServers["test-server"].resolvedAt);
});

Deno.test("updateServerLock - updates existing server entry", () => {
  const lockFile: FtkLockFile = {
    version: "1.0.0",
    updated: new Date().toISOString(),
    mcpServers: {
      "test-server": {
        packageName: "@test/package",
        registry: "npm",
        packageConstraint: "^1.0.0",
        packageResolution: "1.2.3",
      },
    },
  };

  const newServerLock: McpServerLock = {
    packageName: "@test/package",
    registry: "npm",
    packageConstraint: "^1.0.0",
    packageResolution: "1.3.0",
  };

  const updated = updateServerLock(lockFile, "test-server", newServerLock);

  assertEquals(updated.mcpServers["test-server"].packageResolution, "1.3.0");
  assertExists(updated.mcpServers["test-server"].resolvedAt);
});

Deno.test("getServerLock - returns server lock if exists", () => {
  const lockFile: FtkLockFile = {
    version: "1.0.0",
    updated: new Date().toISOString(),
    mcpServers: {
      "test-server": {
        packageName: "@test/package",
        registry: "npm",
        packageConstraint: "^1.0.0",
        packageResolution: "1.2.3",
      },
    },
  };

  const serverLock = getServerLock(lockFile, "test-server");

  assertExists(serverLock);
  assertEquals(serverLock?.packageName, "@test/package");
  assertEquals(serverLock?.packageResolution, "1.2.3");
});

Deno.test("getServerLock - returns undefined if not found", () => {
  const lockFile = createDefaultLockFile();

  const serverLock = getServerLock(lockFile, "nonexistent");

  assertEquals(serverLock, undefined);
});

Deno.test("removeServerLock - removes server entry", () => {
  const lockFile: FtkLockFile = {
    version: "1.0.0",
    updated: new Date().toISOString(),
    mcpServers: {
      "test-server": {
        packageName: "@test/package",
        registry: "npm",
        packageConstraint: "^1.0.0",
        packageResolution: "1.2.3",
      },
      "other-server": {
        packageName: "@other/package",
        registry: "npm",
        packageConstraint: "^2.0.0",
        packageResolution: "2.1.0",
      },
    },
  };

  const updated = removeServerLock(lockFile, "test-server");

  assertEquals(updated.mcpServers["test-server"], undefined);
  assertExists(updated.mcpServers["other-server"]);
  assertEquals(updated.mcpServers["other-server"].packageResolution, "2.1.0");
});

Deno.test("readLockFile - reads existing lock file", async () => {
  const tempDir = await createTempDir();

  try {
    // Write a lock file first
    const lockFile: FtkLockFile = {
      version: "1.0.0",
      updated: new Date().toISOString(),
      mcpServers: {
        "test-server": {
          packageName: "@test/package",
          registry: "npm",
          packageConstraint: "^1.0.0",
          packageResolution: "1.2.3",
        },
      },
    };

    await writeLockFile(tempDir, lockFile);

    // Read it back (YAML snake_case should be converted to camelCase)
    const readBack = await readLockFile(tempDir);

    assertEquals(readBack.version, "1.0.0");
    assertExists(readBack.mcpServers["test-server"]);
    assertEquals(readBack.mcpServers["test-server"].packageResolution, "1.2.3");
    assertEquals(readBack.mcpServers["test-server"].packageName, "@test/package");
    assertEquals(readBack.mcpServers["test-server"].packageConstraint, "^1.0.0");
  } finally {
    await cleanup(tempDir);
  }
});

Deno.test("readLockFile - handles invalid lock file format", async () => {
  const tempDir = await createTempDir();

  try {
    // Write invalid lock file
    const lockFilePath = join(tempDir, ".ftk-lock.yaml");
    await Deno.writeTextFile(lockFilePath, "invalid: yaml: content:");

    // Should return default lock file
    const lockFile = await readLockFile(tempDir);

    assertEquals(lockFile.version, "1.0.0");
    assertEquals(lockFile.mcpServers, {});
  } finally {
    await cleanup(tempDir);
  }
});

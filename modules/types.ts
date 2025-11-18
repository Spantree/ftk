/**
 * Module capability flags (bitmask pattern)
 */
export enum ModuleCapability {
  MCP = 1 << 0, // 1: Provides MCP server
  HOOKS = 1 << 1, // 2: Lifecycle hooks (precheck, configure, install, validate)
  SUBAGENT = 1 << 2, // 4: Claude Code agent integration
  SLASH_CMD = 1 << 3, // 8: Slash command definition
  OAUTH = 1 << 4, // 16: OAuth flow required
  CLI_HELPER = 1 << 5, // 32: CLI-assisted token setup
  GIT_INSTALL = 1 << 6, // 64: Git-based installation
  HTTP_REMOTE = 1 << 7, // 128: HTTP remote endpoint available
}

/**
 * Module category for organization
 */
export type ModuleCategory =
  | "code-context"
  | "ai-search"
  | "web-scraping"
  | "knowledge-management"
  | "reasoning"
  | "development-tools";

/**
 * Installation method
 */
export type InstallationMethod = "npm" | "pypi" | "git" | "http-remote";

/**
 * MCP transport type
 */
export type MCPTransport = "stdio" | "http" | "sse";

/**
 * Authentication type
 */
export type AuthType = "none" | "api-key" | "oauth" | "cli-assisted";

/**
 * Tool filtering configuration
 */
export interface ToolFiltering {
  /** Whether this server supports native tool filtering */
  supported: boolean;
  /** CLI flag for tool filtering (if supported) */
  flag?: string;
  /** Predefined tool presets */
  presets?: Record<
    string,
    {
      description: string;
      tools: string[] | "*";
      tokenEstimate?: number;
    }
  >;
}

/**
 * MCP server configuration
 */
export interface MCPConfig {
  /** Command to run (e.g., "npx", "uvx", "docker") */
  command: string;
  /** Command arguments */
  args: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Tool filtering support */
  tool_filtering?: ToolFiltering;
  /** Transport type (default: stdio) */
  transport?: MCPTransport;
  /** Port for HTTP/SSE transport */
  port?: number;
}

/**
 * Installation configuration
 */
export interface InstallationConfig {
  /** Installation method */
  method: InstallationMethod;
  /** Package name (for npm/pypi) */
  package?: string;
  /** Version to install */
  version?: string;
  /** Git repository URL (for git method) */
  repository?: string;
  /** Git branch/tag/commit (for git method) */
  ref?: string;
  /** HTTP endpoint URL (for http-remote method) */
  endpoint?: string;
}

/**
 * Mutual exclusivity configuration
 */
export interface MutualExclusivity {
  /** Hard conflicts (cannot be used together) */
  hard?: string[];
  /** Soft conflicts (not recommended together) */
  soft?: string[];
}

/**
 * Pricing tier information
 */
export interface PricingTier {
  name: string;
  cost: string;
  limits: string;
}

/**
 * Probing configuration
 */
export interface ProbingConfig {
  /** Whether probing is enabled for this module */
  enabled: boolean;
  /** Whether authentication is required before probing */
  requires_auth?: boolean;
  /** Timeout in milliseconds for probe operation */
  timeout_ms?: number;
}

/**
 * Environment variable declaration
 */
export interface EnvVar {
  /** Environment variable name */
  name: string;
  /** Human-readable description */
  description: string;
  /** Default value (literal string, not placeholder) */
  default?: string;
  /** Whether this env var is required */
  required: boolean;
  /** Whether this is a secret value */
  secret: boolean;
}

/**
 * Module tier for default selection
 */
export type ModuleTier = "default" | "optional";

/**
 * Module metadata (from module.yaml)
 */
export interface ModuleMetadata {
  /** Unique module identifier (kebab-case) */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Module category */
  category: ModuleCategory;
  /** Module tier (default modules installed by default) */
  tier?: ModuleTier;
  /** Capability flags */
  capabilities: string[];
  /** Installation configuration */
  installation: InstallationConfig;
  /** MCP server configuration (if MCP capability) */
  mcp?: MCPConfig;
  /** Authentication type */
  auth?: AuthType;
  /** Probing configuration */
  probing?: ProbingConfig;
  /** Mutual exclusivity rules */
  conflicts?: MutualExclusivity;
  /** Pricing tiers (if applicable) */
  pricing?: PricingTier[];
  /** Estimated token overhead (full tool set, fallback if probing disabled) */
  tokenEstimate?: number;
  /** Environment variable declarations (for tracking and defaults) */
  env_vars?: EnvVar[];
  /** Instruction files for CLAUDE.md (e.g., ["SEQUENTIAL.md", "ADVANCED.md"]) */
  instruction_files?: string[];
}

/**
 * Module context passed to lifecycle hooks
 */
export interface ModuleContext {
  /** Module metadata */
  metadata: ModuleMetadata;
  /** Project directory */
  projectDir: string;
  /** Configuration storage */
  config: Map<string, unknown>;
  /** Logger */
  log: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
    debug: (msg: string) => void;
  };
}

/**
 * Instruction context for polymorphic instruction generation
 * Allows instructions to adapt based on what other modules are installed
 */
export interface InstructionContext {
  /** Module IDs being installed in this session */
  installedModules: string[];
}

/**
 * Instruction content - either static string or dynamic function
 */
export type InstructionContent =
  | string
  | ((ctx: InstructionContext) => string);

/**
 * Precheck result
 */
export interface PrecheckResult {
  success: boolean;
  message?: string;
  warnings?: string[];
}

/**
 * Configuration result
 */
export interface ConfigurationResult {
  success: boolean;
  /** Configuration values (e.g., API keys, OAuth tokens) */
  config?: Record<string, string>;
  /** Environment variables to add to .env.mcp.secrets */
  secrets?: Record<string, string>;
}

/**
 * MCP server entry for .mcp.json
 */
export interface MCPServerEntry {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Installation result
 */
export interface InstallResult {
  success: boolean;
  message?: string;
  /** MCP server configuration to add to .mcp.json */
  mcpConfig?: MCPServerEntry;
  /** CLAUDE.md fragment to append */
  claudeFragment?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  message?: string;
  errors?: string[];
}

/**
 * MCP tool definition (from JSON-RPC schema)
 */
export interface MCPToolDefinition {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Probe result (from spawning MCP server and querying tools)
 */
export interface ProbeResult {
  success: boolean;
  /** List of available tools */
  tools: MCPToolDefinition[];
  /** Token count for MCP tool definitions */
  mcpTokens: number;
  /** Error message if probe failed */
  error?: string;
}

/**
 * Cached metadata stored in .ftk/modules/{id}/metadata.json
 */
export interface CachedMetadata {
  /** Module ID */
  moduleId: string;
  /** Module version (from package, git tag, etc.) */
  version?: string;
  /** Cached token counts */
  cached: {
    /** Tokens for MCP tool definitions */
    mcpTokens: number;
    /** Tokens for instructions.md fragment */
    instructionsTokens: number;
    /** Total tokens */
    totalTokens: number;
    /** Last calculated timestamp */
    calculatedAt: string; // ISO 8601
  };
  /** Probed tool definitions */
  tools?: MCPToolDefinition[];
}

/**
 * Module lifecycle hooks (optional, defined in module.ts)
 */
export interface ModuleHooks {
  /**
   * Pre-installation check (verify dependencies, Claude Code version, etc.)
   */
  precheck?: (ctx: ModuleContext) => Promise<PrecheckResult>;

  /**
   * Interactive configuration (collect API keys, OAuth flow, etc.)
   */
  configure?: (ctx: ModuleContext) => Promise<ConfigurationResult>;

  /**
   * Probe MCP server to get exact tool definitions and token counts
   * Called after configure() if requires_auth, otherwise can be called anytime
   */
  probe?: (ctx: ModuleContext) => Promise<ProbeResult>;

  /**
   * Installation logic (generate .mcp.json entries, update CLAUDE.md, etc.)
   */
  install?: (ctx: ModuleContext) => Promise<InstallResult>;

  /**
   * Post-installation validation
   */
  validate?: (ctx: ModuleContext) => Promise<ValidationResult>;
}

/**
 * Complete module definition (metadata + optional hooks)
 */
export interface Module {
  /** Module metadata */
  metadata: ModuleMetadata;
  /** Optional lifecycle hooks */
  hooks?: ModuleHooks;
  /** Instruction content (embedded as strings or functions for compilation) */
  instructions: Array<{ filename?: string; content: InstructionContent }>;
}

/**
 * Build base environment variables from env_vars declarations
 * Returns an object with env var names mapped to their default values
 *
 * @param envVars - Array of env var declarations from module metadata
 * @returns Record of env var names to default values (only includes vars with defaults)
 */
export function buildBaseEnv(envVars?: EnvVar[]): Record<string, string> {
  if (!envVars) return {};

  const baseEnv: Record<string, string> = {};

  for (const envVar of envVars) {
    // Only include vars that have a default value
    if (envVar.default !== undefined) {
      baseEnv[envVar.name] = envVar.default;
    }
  }

  return baseEnv;
}

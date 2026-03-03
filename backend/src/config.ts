import dotenv from "dotenv";

dotenv.config();

/**
 * Typed configuration from environment variables.
 * Reads from process.env with defaults where appropriate.
 */
export const CONFIG = {
  /** ACS resource connection string */
  ACS_CONNECTION_STRING: process.env.ACS_CONNECTION_STRING ?? "",

  /** WhatsApp channel registration GUID */
  ACS_CHANNEL_REGISTRATION_ID: process.env.ACS_CHANNEL_REGISTRATION_ID ?? "",

  /** Company name displayed in the UI and outbound messages */
  COMPANY_NAME: process.env.COMPANY_NAME ?? "",

  /** Server port */
  PORT: parseInt(process.env.PORT ?? "3000", 10),

  /** Environment */
  NODE_ENV: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production",

  // ==================== AI Foundry ====================

  /** Azure AI Foundry project endpoint URL */
  AZURE_AI_PROJECT_ENDPOINT: process.env.AZURE_AI_PROJECT_ENDPOINT ?? "",

  /**
   * The ID of the triage agent in AI Foundry.
   * This agent receives every inbound message and is responsible for
   * handing off the conversation to the appropriate specialized agent
   * via Connected Agent tools.
   */
  AZURE_AI_AGENT_ID: process.env.AZURE_AI_AGENT_ID ?? "",

  // ==================== Cosmos DB ====================

  /**
   * Cosmos DB connection string (preferred for local dev).
   * If empty, the service falls back to COSMOS_DB_ENDPOINT + DefaultAzureCredential.
   */
  COSMOS_DB_CONNECTION_STRING: process.env.COSMOS_DB_CONNECTION_STRING ?? "",

  /** Cosmos DB account endpoint (used with DefaultAzureCredential when no connection string). */
  COSMOS_DB_ENDPOINT: process.env.COSMOS_DB_ENDPOINT ?? "",

  /** Cosmos DB database name for conversation state */
  COSMOS_DB_DATABASE_NAME: process.env.COSMOS_DB_DATABASE_NAME ?? "whatsapp-agents",

  /** Cosmos DB container name for phone→thread mapping */
  COSMOS_DB_CONTAINER_NAME: process.env.COSMOS_DB_CONTAINER_NAME ?? "conversations",

  // ==================== Agent Thread Management ====================

  /**
   * Maximum idle time (in milliseconds) before a new AI Foundry thread is
   * created for the same phone number.  Defaults to 5 minutes (300 000 ms).
   * Set via the AGENT_THREAD_IDLE_TIMEOUT_MS environment variable.
   */
  AGENT_THREAD_IDLE_TIMEOUT_MS: parseInt(
    process.env.AGENT_THREAD_IDLE_TIMEOUT_MS ?? "300000",
    10
  ),
} as const;

/**
 * Validates that all required environment variables are set.
 * Logs warnings for missing optional variables.
 */
export function validateConfig(): void {
  const required: Array<keyof typeof CONFIG> = [
    "ACS_CONNECTION_STRING",
    "ACS_CHANNEL_REGISTRATION_ID",
    "COMPANY_NAME",
  ];

  const missing = required.filter((key) => !CONFIG[key]);

  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missing.join(", ")}. Some features may not work.`
    );
  }

  // AI Foundry agent warnings
  if (!CONFIG.AZURE_AI_PROJECT_ENDPOINT || !CONFIG.AZURE_AI_AGENT_ID) {
    console.warn(
      "⚠️  AI Foundry agent variables (AZURE_AI_PROJECT_ENDPOINT, AZURE_AI_AGENT_ID) not set. " +
        "Inbound messages will not be routed to the AI agent."
    );
  }

  // Cosmos DB warnings
  if (!CONFIG.COSMOS_DB_CONNECTION_STRING && !CONFIG.COSMOS_DB_ENDPOINT) {
    console.warn(
      "⚠️  No Cosmos DB connection configured (COSMOS_DB_CONNECTION_STRING or COSMOS_DB_ENDPOINT). " +
        "Conversation state will not be persisted."
    );
  }
}

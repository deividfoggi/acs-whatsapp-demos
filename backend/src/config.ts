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
}

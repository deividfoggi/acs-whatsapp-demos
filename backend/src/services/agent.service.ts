import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import { CONFIG } from "../config.js";
import {
  getConversationState,
  upsertConversationState,
} from "./cosmos.service.js";
import { AgentConversationState } from "../types/index.js";

/**
 * Singleton AI Foundry project client.
 * The `.agents` accessor returns the underlying AgentsClient which exposes
 * threads, messages, and runs for the triage agent.
 */
let projectClient: AIProjectClient | null = null;

/**
 * Returns the shared AIProjectClient instance, lazily initialised.
 */
function getProjectClient(): AIProjectClient {
  if (!projectClient) {
    if (!CONFIG.AZURE_AI_PROJECT_ENDPOINT) {
      throw new Error(
        "AZURE_AI_PROJECT_ENDPOINT is not configured. Cannot initialise AI Foundry client."
      );
    }
    projectClient = new AIProjectClient(
      CONFIG.AZURE_AI_PROJECT_ENDPOINT,
      new DefaultAzureCredential()
    );
  }
  return projectClient;
}

/**
 * Ensures an AI Foundry thread exists for `phone`, creating one if needed.
 * The phone → thread mapping is persisted in Cosmos DB so that the same
 * thread is reused across every interaction with that WhatsApp user.
 */
async function ensureThread(phone: string): Promise<AgentConversationState> {
  const existing = await getConversationState(phone);

  if (existing) {
    const lastActivity = new Date(existing.updatedAt).getTime();
    const idleMs = Date.now() - lastActivity;
    const idleSec = Math.round(idleMs / 1000);

    if (idleMs > CONFIG.AGENT_THREAD_IDLE_TIMEOUT_MS) {
      // Thread has been idle beyond the threshold — rotate to a fresh thread
      const client = getProjectClient();
      const newThread = await client.agents.threads.create();
      const oldThreadId = existing.threadId;

      existing.threadId = newThread.id;
      existing.createdAt = new Date().toISOString();
      existing.updatedAt = existing.createdAt;
      await upsertConversationState(existing);

      console.log(
        `[Agent] Thread rotated for ${phone} ` +
          `(old: ${oldThreadId}, new: ${newThread.id}, idle: ${idleSec}s)`
      );
      return existing;
    }

    console.log(
      `[Agent] Reusing thread ${existing.threadId} for ${phone} (idle: ${idleSec}s)`
    );
    return existing;
  }

  // No existing state — create the very first thread for this phone number
  const client = getProjectClient();
  const thread = await client.agents.threads.create();

  const now = new Date().toISOString();
  const state: AgentConversationState = {
    phoneNumber: phone,
    threadId: thread.id,
    createdAt: now,
    updatedAt: now,
  };

  await upsertConversationState(state);
  console.log(`[Agent] Created new thread ${thread.id} for phone ${phone}`);
  return state;
}

/**
 * Processes an inbound WhatsApp text message through the AI Foundry
 * triage agent and returns the agent's text response.
 *
 * Flow:
 *   1. Look up (or create) the AI Foundry thread for this phone number.
 *   2. Append the user's message to the thread.
 *   3. Create a run against the triage agent and poll until it completes.
 *      - If the triage agent invokes a **Connected Agent** tool, the
 *        platform handles the handoff transparently within the same run.
 *   4. Extract the latest assistant message from the thread.
 *   5. Update the conversation state timestamp in Cosmos DB.
 *
 * @param phone - Phone number in E.164 format.
 * @param messageText - The text message sent by the user.
 * @returns The agent's response text.
 * @throws If the run fails or no assistant response is found.
 */
export async function processInboundMessage(
  phone: string,
  messageText: string
): Promise<string> {
  const client = getProjectClient();
  const agents = client.agents;

  // 1. Get or create thread
  const state = await ensureThread(phone);

  // 2. Append user message to the thread
  await agents.messages.create(state.threadId, "user", messageText);
  console.log(`[Agent] Added user message to thread ${state.threadId}`);

  // 3. Run the triage agent
  if (!CONFIG.AZURE_AI_AGENT_ID) {
    throw new Error(
      "AZURE_AI_AGENT_ID is not configured. Cannot run the triage agent."
    );
  }

  const run = await agents.runs.createAndPoll(
    state.threadId,
    CONFIG.AZURE_AI_AGENT_ID,
    { pollingOptions: { intervalInMs: 1000 } }
  );

  if (run.status !== "completed") {
    const errorInfo = run.lastError
      ? ` — ${run.lastError.code}: ${run.lastError.message}`
      : "";
    console.error(
      `[Agent] Run ${run.id} finished with status "${run.status}"${errorInfo}`
    );
    throw new Error(`Agent run failed with status: ${run.status}${errorInfo}`);
  }

  console.log(`[Agent] Run ${run.id} completed successfully`);

  // 4. Extract the latest assistant message
  const messages = agents.messages.list(state.threadId, { order: "desc" });

  for await (const msg of messages) {
    if (msg.role === "assistant") {
      const textContent = msg.content?.find(
        (c: { type: string }) => c.type === "text"
      );

      if (textContent && "text" in textContent) {
        const responseText = (textContent as { text: { value: string } }).text
          .value;

        // 5. Update Cosmos DB timestamp
        state.updatedAt = new Date().toISOString();
        await upsertConversationState(state);

        return responseText;
      }
    }
  }

  throw new Error("No assistant response found in thread after run completed.");
}

/**
 * Returns `true` when the AI Foundry agent integration is fully configured
 * (project endpoint + agent ID + Cosmos DB connection), `false` otherwise.
 */
export function isAgentConfigured(): boolean {
  const hasAI =
    Boolean(CONFIG.AZURE_AI_PROJECT_ENDPOINT) &&
    Boolean(CONFIG.AZURE_AI_AGENT_ID);
  const hasCosmos =
    Boolean(CONFIG.COSMOS_DB_CONNECTION_STRING) ||
    Boolean(CONFIG.COSMOS_DB_ENDPOINT);
  return hasAI && hasCosmos;
}

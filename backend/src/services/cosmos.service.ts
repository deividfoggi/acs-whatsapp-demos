import { CosmosClient, Container } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { CONFIG } from "../config.js";
import { AgentConversationState } from "../types/index.js";

/** Singleton Cosmos DB container reference. */
let container: Container | null = null;

/**
 * Returns the Cosmos DB container for conversation state, creating
 * the database and container if they do not exist yet.
 *
 * Authentication priority:
 *   1. COSMOS_DB_CONNECTION_STRING (key-based — handy for local dev)
 *   2. COSMOS_DB_ENDPOINT + DefaultAzureCredential (Entra ID / RBAC)
 */
async function getContainer(): Promise<Container> {
  if (container) return container;

  let client: CosmosClient;

  if (CONFIG.COSMOS_DB_CONNECTION_STRING) {
    client = new CosmosClient(CONFIG.COSMOS_DB_CONNECTION_STRING);
  } else if (CONFIG.COSMOS_DB_ENDPOINT) {
    client = new CosmosClient({
      endpoint: CONFIG.COSMOS_DB_ENDPOINT,
      aadCredentials: new DefaultAzureCredential(),
    });
  } else {
    throw new Error(
      "Cosmos DB is not configured. Set COSMOS_DB_CONNECTION_STRING or COSMOS_DB_ENDPOINT."
    );
  }

  // Reference existing database and container directly.
  // Pre-create them if they don't exist:
  //   az cosmosdb sql database create --name <db> ...
  //   az cosmosdb sql container create --name <container> --partition-key-path "/phoneNumber" ...
  // This avoids needing control-plane RBAC (sqlDatabases/write) which
  // is not covered by the "Cosmos DB Built-in Data Contributor" role.
  const database = client.database(CONFIG.COSMOS_DB_DATABASE_NAME);
  container = database.container(CONFIG.COSMOS_DB_CONTAINER_NAME);

  console.log(
    `[Cosmos] Connected — db="${CONFIG.COSMOS_DB_DATABASE_NAME}" container="${CONFIG.COSMOS_DB_CONTAINER_NAME}"`
  );

  return container;
}

/**
 * Retrieves the conversation state (phone → thread mapping) for a given phone number.
 * @returns The state document, or `null` if no thread exists yet.
 */
export async function getConversationState(
  phone: string
): Promise<AgentConversationState | null> {
  const cont = await getContainer();

  try {
    const { resource } = await cont
      .item(phone, phone)
      .read<AgentConversationState>();
    return resource ?? null;
  } catch (error: unknown) {
    const status =
      (error as { statusCode?: number }).statusCode ??
      (error as { code?: number }).code;
    if (status === 404) return null;
    throw error;
  }
}

/**
 * Creates or updates the conversation state for a phone number.
 * Uses the phone number as both the document `id` and the partition key.
 */
export async function upsertConversationState(
  state: AgentConversationState
): Promise<void> {
  const cont = await getContainer();
  await cont.items.upsert({ ...state, id: state.phoneNumber });
}

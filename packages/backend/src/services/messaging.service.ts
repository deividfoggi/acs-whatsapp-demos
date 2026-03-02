import MessageClient from "@azure-rest/communication-messages";
import type { MessageTemplate as AcsMessageTemplate } from "@azure-rest/communication-messages";
import { CONFIG } from "../config.js";
import type {
  MessageTemplate,
  TemplateParameterValue,
  TemplateBindings,
} from "../types/index.js";
import { PREDEFINED_TEMPLATES } from "../data/template-definitions.js";

/**
 * Lazily-initialized ACS Notification Client.
 * Returns null if the connection string is not configured.
 */
function getClient(): ReturnType<typeof MessageClient> | null {
  if (!CONFIG.ACS_CONNECTION_STRING) {
    console.warn("[ACS] Connection string not configured — messages will not be sent");
    return null;
  }
  return MessageClient(CONFIG.ACS_CONNECTION_STRING);
}

/**
 * Sends a text message to a WhatsApp user via ACS Advanced Messaging.
 * @param recipientPhone - Recipient phone number in E.164 format
 * @param text - Message content to send
 * @returns The ACS message ID
 * @throws Error if the message could not be sent
 */
export async function sendTextMessage(
  recipientPhone: string,
  text: string
): Promise<string> {
  console.log(
    `[ACS] Sending text to ${maskPhone(recipientPhone)}: "${text.substring(0, 50)}..."`
  );

  const client = getClient();
  if (!client) {
    // Fallback for local dev without ACS credentials
    const dummyId = `msg_${Date.now()}`;
    console.warn(`[ACS] No client available — returning dummy messageId: ${dummyId}`);
    return dummyId;
  }

  const result = await client.path("/messages/notifications:send").post({
    contentType: "application/json",
    body: {
      channelRegistrationId: CONFIG.ACS_CHANNEL_REGISTRATION_ID,
      to: [recipientPhone],
      kind: "text",
      content: text,
    },
  });

  if (result.status === "202") {
    const body = result.body as { receipts: Array<{ messageId: string; to: string }> };
    const receipt = body.receipts[0];
    console.log(
      `[ACS] Message sent to ${maskPhone(recipientPhone)} → messageId: ${receipt.messageId}`
    );
    return receipt.messageId;
  }

  console.error(`[ACS] Failed to send message — status: ${result.status}`, result.body);
  throw new Error(`Failed to send WhatsApp message (status ${result.status})`);
}

/**
 * Sends a WhatsApp Flow interactive message to a user.
 * Placeholder — will be implemented for the WhatsApp Flows demo.
 * @param recipientPhone - Recipient phone in E.164 format
 * @param flowId - The WhatsApp Flow ID
 * @param flowToken - Token to correlate the flow session
 * @returns Message ID (dummy)
 */
export async function sendFlowMessage(
  recipientPhone: string,
  flowId: string,
  flowToken: string
): Promise<string> {
  const messageId = `msg_${Date.now()}`;
  console.log(
    `[ACS] Sending flow ${flowId} to ${maskPhone(recipientPhone)} → messageId: ${messageId}`
  );

  // TODO: Replace with actual ACS interactive message call

  return messageId;
}

/**
 * Sends a WhatsApp template message to a user via ACS Advanced Messaging.
 * @param recipientPhone - Recipient phone number in E.164 format
 * @param template - The assembled message template (name, language, values, bindings)
 * @returns The ACS message ID
 * @throws Error if the message could not be sent
 */
export async function sendTemplateMessage(
  recipientPhone: string,
  template: MessageTemplate
): Promise<string> {
  console.log(
    `[ACS] Sending template "${template.name}" (${template.language}) to ${maskPhone(recipientPhone)}`
  );

  const client = getClient();
  if (!client) {
    const dummyId = `tmpl_${Date.now()}`;
    console.warn(`[ACS] No client available — returning dummy messageId: ${dummyId}`);
    return dummyId;
  }

  const result = await client.path("/messages/notifications:send").post({
    contentType: "application/json",
    body: {
      channelRegistrationId: CONFIG.ACS_CHANNEL_REGISTRATION_ID,
      to: [recipientPhone],
      kind: "template",
      template: template as unknown as AcsMessageTemplate,
    },
  });

  if (result.status === "202") {
    const body = result.body as { receipts: Array<{ messageId: string; to: string }> };
    const receipt = body.receipts[0];
    console.log(
      `[ACS] Template sent to ${maskPhone(recipientPhone)} → messageId: ${receipt.messageId}`
    );
    return receipt.messageId;
  }

  console.error(`[ACS] Failed to send template — status: ${result.status}`, result.body);
  throw new Error(`Failed to send WhatsApp template (status ${result.status})`);
}

/**
 * Lists all WhatsApp message templates available on the configured channel.
 * Returns mock data when ACS credentials are not configured.
 * @returns Array of template metadata objects from the ACS API
 */
export async function listChannelTemplates(): Promise<Record<string, unknown>[]> {
  const channelId = CONFIG.ACS_CHANNEL_REGISTRATION_ID;
  console.log(`[ACS] Listing templates for channel ${channelId || "(not configured)"}`);

  const client = getClient();
  if (!client || !channelId) {
    console.warn("[ACS] No client/channel — returning predefined templates as mock data");
    return PREDEFINED_TEMPLATES.map((t) => ({
      name: t.templateName,
      language: t.language,
      status: "approved",
      content: `[Predefined] ${t.description}`,
    }));
  }

  const templates: Record<string, unknown>[] = [];
  const response = await client
    .path("/messages/channels/{channelId}/templates", channelId)
    .get();

  if (response.status === "200") {
    const body = response.body as { value?: Record<string, unknown>[] };
    if (body.value) {
      templates.push(...body.value);
    }
  } else {
    console.error(`[ACS] Failed to list templates — status: ${response.status}`, response.body);
    throw new Error(`Failed to list templates (status ${response.status})`);
  }

  console.log(`[ACS] Found ${templates.length} templates`);
  return templates;
}

/**
 * Masks a phone number for safe logging.
 * @param phone - Full phone number
 * @returns Masked phone (e.g., "+5511***0001")
 */
export function maskPhone(phone: string): string {
  if (phone.length < 7) return "***";
  return phone.slice(0, 4) + "***" + phone.slice(-4);
}

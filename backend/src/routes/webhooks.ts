import { Router, Request, Response, NextFunction } from "express";
import {
  EventGridEvent,
  AdvancedMessageReceivedData,
  DeliveryStatusData,
  InteractiveReply,
  MessageDirection,
} from "../types/index.js";
import { maskPhone, sendTextMessage } from "../services/messaging.service.js";
import { addMessage, updateMessageStatus } from "../services/conversation.service.js";
import { processInboundMessage, isAgentConfigured } from "../services/agent.service.js";
import { isSupportMenuEnabled, processMenuMessage } from "../services/support-menu.service.js";

const router = Router();

/**
 * POST /api/webhooks/acs
 * Receives Azure Event Grid notifications for ACS Advanced Messaging.
 * Handles subscription validation, incoming messages, and delivery receipts.
 */
router.post("/", (req: Request, res: Response) => {
  const events = req.body as EventGridEvent[];

  if (!Array.isArray(events)) {
    console.warn("[Webhook] Received non-array body, ignoring");
    res.status(200).send();
    return;
  }

  for (const event of events) {
    try {
      // Event Grid subscription validation handshake
      if (
        event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent"
      ) {
        const validationCode = (event.data as Record<string, string>)
          .validationCode;
        console.log(
          `[Webhook] Subscription validation received, echoing code`
        );
        res.json({ validationResponse: validationCode });
        return;
      }

      // Incoming WhatsApp message
      if (
        event.eventType ===
        "Microsoft.Communication.AdvancedMessageReceived"
      ) {
        const data = event.data as unknown as AdvancedMessageReceivedData;
        // Normalize phone to E.164 (WhatsApp sends without '+' prefix)
        const phone = data.from.startsWith("+") ? data.from : `+${data.from}`;

        // Check for interactive button reply (Quick Reply / CTA tap)
        let interactiveReply: InteractiveReply | undefined;
        let messageText = data.content ?? "";

        if (data.interactiveContent) {
          const ic = data.interactiveContent as Record<string, unknown>;
          const reply = ic.buttonReply as
            | { id: string; title: string }
            | undefined;
          if (reply) {
            interactiveReply = { id: reply.id, title: reply.title };
            messageText = messageText || `[Button: ${reply.title}]`;
            console.log(
              `[Webhook] Interactive reply from ${maskPhone(phone)}: button="${reply.title}" id="${reply.id}"`
            );
          }
        }

        if (!interactiveReply) {
          console.log(
            `[Webhook] Message from ${maskPhone(phone)}: "${messageText.substring(0, 50)}"`
          );
        }

        // Store the inbound message in the conversation service
        const messageId = `inbound_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        addMessage(
          phone,
          MessageDirection.Inbound,
          messageText,
          messageId,
          interactiveReply ? { interactiveReply } : undefined
        );

        // ── Route through Support Menu URA (takes priority when enabled) ──
        if (isSupportMenuEnabled()) {
          handleSupportMenuResponse(phone, messageText).catch((err) => {
            console.error(
              `[Webhook] Support menu processing failed for ${maskPhone(phone)}:`,
              err
            );
          });
        // ── Route through AI Foundry agent (fire-and-forget) ──────────
        } else if (isAgentConfigured()) {
          handleAgentResponse(phone, messageText).catch((err) => {
            console.error(
              `[Webhook] Agent processing failed for ${maskPhone(phone)}:`,
              err
            );
          });
        } else {
          console.warn(
            `[Webhook] Agent is not configured — inbound message from ${maskPhone(phone)} was stored but not processed. ` +
              `Ensure AZURE_AI_PROJECT_ENDPOINT, AZURE_AI_AGENT_ID, and COSMOS_DB_CONNECTION_STRING (or COSMOS_DB_ENDPOINT) are set.`
          );
        }
      }

      // Delivery status update — track in conversation store and emit via SSE
      if (
        event.eventType ===
        "Microsoft.Communication.AdvancedMessageDeliveryStatusUpdated"
      ) {
        const data = event.data as unknown as DeliveryStatusData;
        console.log(
          `[Webhook] Delivery status: messageId=${data.messageId} status=${data.status}`
        );
        updateMessageStatus(data.messageId, data.status, data.timestamp);
      }
    } catch (error) {
      // Always return 200 to Event Grid to prevent retries
      console.error(`[Webhook] Error processing event ${event.id}:`, error);
    }
  }

  res.status(200).send();
});

// ── Agent response helper (runs asynchronously after 200 is returned) ──

/**
 * Sends the inbound message to the AI Foundry triage agent, waits for the
 * response, and sends it back to the user via ACS WhatsApp.
 *
 * This function is called in a fire-and-forget fashion so that the
 * Event Grid webhook always returns 200 immediately.
 */
async function handleAgentResponse(
  phone: string,
  messageText: string
): Promise<void> {
  try {
    const agentReply = await processInboundMessage(phone, messageText);

    const outboundId = await sendTextMessage(phone, agentReply);

    addMessage(phone, MessageDirection.Outbound, agentReply, outboundId);

    console.log(
      `[Webhook] Agent reply sent to ${maskPhone(phone)} (msgId=${outboundId})`
    );
  } catch (error) {
    console.error(
      `[Webhook] Failed to process agent response for ${maskPhone(phone)}:`,
      error
    );

    // Best-effort: notify the user that something went wrong
    try {
      const errorMsg =
        "Sorry, I'm having trouble processing your request right now. Please try again in a moment.";
      const errorMsgId = await sendTextMessage(phone, errorMsg);
      addMessage(phone, MessageDirection.Outbound, errorMsg, errorMsgId);
    } catch {
      console.error(
        `[Webhook] Could not send error message to ${maskPhone(phone)}`
      );
    }
  }
}

// ── Support Menu response helper (runs asynchronously after 200 is returned) ──

/**
 * Processes the inbound message through the URA-style support menu
 * and sends the reply back to the user via ACS WhatsApp.
 */
async function handleSupportMenuResponse(
  phone: string,
  messageText: string
): Promise<void> {
  try {
    const reply = processMenuMessage(phone, messageText);
    if (!reply) return;

    const outboundId = await sendTextMessage(phone, reply);
    addMessage(phone, MessageDirection.Outbound, reply, outboundId);

    console.log(
      `[Webhook] Support menu reply sent to ${maskPhone(phone)} (msgId=${outboundId})`
    );
  } catch (error) {
    console.error(
      `[Webhook] Failed to send support menu reply to ${maskPhone(phone)}:`,
      error
    );
  }
}

export default router;

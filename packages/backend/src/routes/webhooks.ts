import { Router, Request, Response, NextFunction } from "express";
import {
  EventGridEvent,
  AdvancedMessageReceivedData,
  DeliveryStatusData,
  InteractiveReply,
  MessageDirection,
} from "../types/index.js";
import { maskPhone } from "../services/messaging.service.js";
import { addMessage, updateMessageStatus } from "../services/conversation.service.js";

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

export default router;

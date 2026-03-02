import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendTextMessage } from "../services/messaging.service.js";
import {
  addMessage,
  getMessages,
  getAllConversations,
  conversationEvents,
} from "../services/conversation.service.js";
import { ErrorCode, MessageDirection } from "../types/index.js";
import type { ConversationMessage } from "../types/index.js";

const router = Router();

/**
 * Wraps an async route handler to catch unhandled promise rejections.
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/** Zod schema for the send-message request body. */
const SendMessageSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+\d{10,15}$/, "Phone must be E.164 format (e.g., +5511999990001)"),
  text: z.string().min(1, "Message text is required").max(4096, "Message too long"),
});

/**
 * POST /api/messages/send
 * Sends a text message to a WhatsApp user via ACS.
 */
router.post(
  "/send",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = SendMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.InvalidInput,
          message: parsed.error.issues.map((i) => i.message).join("; "),
        },
      });
      return;
    }

    const { phone, text } = parsed.data;

    try {
      const messageId = await sendTextMessage(phone, text);
      addMessage(phone, MessageDirection.Outbound, text, messageId);

      res.status(200).json({
        success: true,
        data: { messageId },
      });
    } catch (error) {
      console.error("[Messages] Failed to send:", error);
      res.status(500).json({
        success: false,
        error: {
          code: ErrorCode.MessageSendFailed,
          message: error instanceof Error ? error.message : "Failed to send message",
        },
      });
    }
  })
);

/**
 * GET /api/messages/stream
 * Server-Sent Events endpoint for real-time message updates.
 * Must be mounted BEFORE the /:phone param route.
 */
router.get("/stream", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send a comment to keep the connection alive
  res.write(": connected\n\n");

  const onMessage = (message: ConversationMessage) => {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  };

  const onStatus = (statusUpdate: Record<string, unknown>) => {
    res.write(`event: status\ndata: ${JSON.stringify(statusUpdate)}\n\n`);
  };

  conversationEvents.on("message", onMessage);
  conversationEvents.on("status", onStatus);

  // Keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 30_000);

  req.on("close", () => {
    conversationEvents.off("message", onMessage);
    conversationEvents.off("status", onStatus);
    clearInterval(keepAlive);
  });
});

/**
 * GET /api/messages
 * Returns a summary of all active conversations.
 */
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const conversations = getAllConversations();
    res.json({ success: true, data: conversations });
  })
);

/**
 * GET /api/messages/:phone
 * Returns the full conversation history for a phone number.
 */
router.get(
  "/:phone",
  asyncHandler(async (req: Request, res: Response) => {
    const phone = req.params.phone as string;
    const decodedPhone = decodeURIComponent(phone);
    const messages = getMessages(decodedPhone);
    res.json({ success: true, data: messages });
  })
);

export default router;

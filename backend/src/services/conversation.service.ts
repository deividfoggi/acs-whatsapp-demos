import { EventEmitter } from "node:events";
import {
  ConversationMessage,
  ConversationSummary,
  InteractiveReply,
  MessageDirection,
} from "../types/index.js";

/**
 * In-memory conversation store.
 * Key: phone number (E.164), Value: ordered list of messages.
 */
const conversations = new Map<string, ConversationMessage[]>();

/**
 * Event emitter for real-time message notifications (SSE).
 * Emits "message" events with a ConversationMessage payload.
 */
export const conversationEvents = new EventEmitter();

// Allow many SSE listeners without warning
conversationEvents.setMaxListeners(100);

/**
 * Options for storing additional metadata on a message.
 */
export interface AddMessageOptions {
  /** Name of the template used (outbound template messages). */
  templateName?: string;
  /** Interactive button reply data (inbound button taps). */
  interactiveReply?: InteractiveReply;
}

/**
 * Adds a message to the conversation store and emits an event for SSE subscribers.
 * @param phone - Phone number in E.164 format
 * @param direction - Whether the message is inbound or outbound
 * @param text - Message content
 * @param messageId - ACS message ID or generated ID
 * @param options - Optional metadata (templateName, interactiveReply)
 * @returns The stored ConversationMessage
 */
export function addMessage(
  phone: string,
  direction: MessageDirection,
  text: string,
  messageId: string,
  options?: AddMessageOptions
): ConversationMessage {
  const message: ConversationMessage = {
    id: messageId,
    phone,
    direction,
    text,
    timestamp: new Date().toISOString(),
    ...(options?.templateName ? { templateName: options.templateName } : {}),
    ...(options?.interactiveReply
      ? { interactiveReply: options.interactiveReply }
      : {}),
  };

  const history = conversations.get(phone) ?? [];
  history.push(message);
  conversations.set(phone, history);

  // Notify all SSE subscribers
  conversationEvents.emit("message", message);

  return message;
}

/**
 * Updates the delivery status of a previously sent message and emits a status event.
 * @param messageId - The ACS message ID to update
 * @param status - New status (e.g., "sent", "delivered", "read", "failed")
 * @param timestamp - Timestamp of the status change
 * @returns true if the message was found and updated, false otherwise
 */
export function updateMessageStatus(
  messageId: string,
  status: string,
  timestamp: string
): boolean {
  for (const [phone, messages] of conversations.entries()) {
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      msg.status = status;
      conversationEvents.emit("status", {
        messageId,
        phone,
        status,
        timestamp,
      });
      return true;
    }
  }
  return false;
}

/**
 * Returns the full conversation history for a given phone number.
 * @param phone - Phone number in E.164 format
 * @returns Array of messages, oldest first
 */
export function getMessages(phone: string): ConversationMessage[] {
  return conversations.get(phone) ?? [];
}

/**
 * Returns a summary of all active conversations.
 * Sorted by most recent message first.
 * @returns Array of conversation summaries
 */
export function getAllConversations(): ConversationSummary[] {
  const summaries: ConversationSummary[] = [];

  for (const [phone, messages] of conversations.entries()) {
    if (messages.length === 0) continue;

    const lastMsg = messages[messages.length - 1];
    summaries.push({
      phone,
      lastMessage: lastMsg.text,
      lastTimestamp: lastMsg.timestamp,
      messageCount: messages.length,
    });
  }

  // Most recent conversations first
  summaries.sort(
    (a, b) =>
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
  );

  return summaries;
}

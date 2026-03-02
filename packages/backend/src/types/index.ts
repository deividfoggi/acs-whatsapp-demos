/** Shared TypeScript interfaces for TheFoggi Consultancy WhatsApp Demos */

/**
 * Represents a student enrolled in a TheFoggi Consultancy school.
 */
export interface Student {
  readonly id: string;
  readonly name: string;
  readonly grade: string;
  readonly parentPhone: string;
  readonly schoolName: string;
}

/**
 * Represents a fee owed by a student (tuition, materials, activities, etc.).
 */
export interface Fee {
  readonly id: string;
  readonly studentId: string;
  readonly description: string;
  readonly amount: number;
  readonly dueDate: string;
  status: FeeStatus;
}

/**
 * Status of a fee.
 */
export enum FeeStatus {
  Pending = "pending",
  Paid = "paid",
  Overdue = "overdue",
}

/**
 * Represents a payment made against a fee.
 */
export interface Payment {
  readonly id: string;
  readonly studentId: string;
  readonly feeId: string;
  readonly amount: number;
  readonly method: PaymentMethod;
  readonly timestamp: string;
  status: PaymentStatus;
}

/**
 * Supported payment methods.
 */
export enum PaymentMethod {
  CreditCard = "credit_card",
  BankTransfer = "bank_transfer",
  Pix = "pix",
}

/**
 * Status of a payment transaction.
 */
export enum PaymentStatus {
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
}

/**
 * Consistent API success response shape.
 */
export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Consistent API error response shape.
 */
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

/**
 * Union type for all API responses.
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Error codes used across the application.
 */
export enum ErrorCode {
  StudentNotFound = "STUDENT_NOT_FOUND",
  FeeNotFound = "FEE_NOT_FOUND",
  PaymentFailed = "PAYMENT_FAILED",
  InvalidInput = "INVALID_INPUT",
  MissingParameter = "MISSING_PARAMETER",
  InternalError = "INTERNAL_ERROR",
  UnknownEventType = "UNKNOWN_EVENT_TYPE",
  MessageSendFailed = "MESSAGE_SEND_FAILED",
  TemplateSendFailed = "TEMPLATE_SEND_FAILED",
  TemplateListFailed = "TEMPLATE_LIST_FAILED",
}

/**
 * Direction of a WhatsApp conversation message.
 */
export enum MessageDirection {
  Inbound = "inbound",
  Outbound = "outbound",
}

/**
 * Represents a single message in a WhatsApp conversation.
 */
export interface ConversationMessage {
  readonly id: string;
  readonly phone: string;
  readonly direction: MessageDirection;
  readonly text: string;
  readonly timestamp: string;
  status?: string;
  /** Name of the template that originated this message (outbound templates only). */
  templateName?: string;
  /** Populated when the inbound message is an interactive button reply. */
  interactiveReply?: InteractiveReply;
}

/**
 * Represents a user's interactive button reply (e.g., Quick Reply tap).
 */
export interface InteractiveReply {
  /** The button payload ID defined in the template. */
  readonly id: string;
  /** The button title text the user tapped. */
  readonly title: string;
}

/**
 * Summary of a conversation with a WhatsApp user.
 */
export interface ConversationSummary {
  readonly phone: string;
  readonly lastMessage: string;
  readonly lastTimestamp: string;
  readonly messageCount: number;
}

/**
 * Azure Event Grid event structure.
 */
export interface EventGridEvent {
  readonly id: string;
  readonly eventType: string;
  readonly subject: string;
  readonly eventTime: string;
  readonly data: Record<string, unknown>;
  readonly dataVersion: string;
}

/**
 * ACS Advanced Message Received event data.
 */
export interface AdvancedMessageReceivedData {
  readonly from: string;
  readonly content: string;
  readonly channelType: string;
  readonly receivedTimestamp: string;
  /** Present when the user taps an interactive button (Quick Reply / CTA). */
  readonly interactiveContent?: {
    readonly type: string;
    readonly [key: string]: unknown;
  };
}

/**
 * ACS Delivery Status Updated event data.
 */
export interface DeliveryStatusData {
  readonly messageId: string;
  readonly status: string;
  readonly channelType: string;
  readonly timestamp: string;
}

/**
 * WhatsApp Flows Data Endpoint request body.
 */
export interface FlowsEndpointRequest {
  readonly action: "INIT" | "data_exchange" | "BACK";
  readonly screen?: string;
  readonly data?: Record<string, unknown>;
  readonly flow_token?: string;
}

/**
 * WhatsApp Flows Data Endpoint response body.
 */
export interface FlowsEndpointResponse {
  readonly screen: string;
  readonly data: Record<string, unknown>;
}

// ==================== Template Messaging Types ====================

/**
 * A single template parameter value passed to the ACS SDK.
 */
export interface TemplateParameterValue {
  readonly kind: "text" | "image" | "document" | "video" | "location";
  readonly name: string;
  readonly text: string;
}

/**
 * A reference to a parameter value, used inside bindings.
 */
export interface TemplateParameterRef {
  readonly refValue: string;
}

/**
 * Bindings that map parameter values to template component slots.
 */
export interface TemplateBindings {
  readonly kind: "whatsApp";
  readonly header?: readonly TemplateParameterRef[];
  readonly body?: readonly TemplateParameterRef[];
  readonly button?: readonly TemplateButtonBinding[];
}

/**
 * A button binding for Quick Reply or Call-to-Action buttons.
 */
export interface TemplateButtonBinding {
  readonly subType: "quickReply" | "url";
  readonly refValue: string;
}

/**
 * The assembled message template object sent to the ACS SDK.
 */
export interface MessageTemplate {
  readonly name: string;
  readonly language: string;
  readonly values?: readonly TemplateParameterValue[];
  readonly bindings?: TemplateBindings;
}

/**
 * Describes a parameter field in a predefined template definition (for UI rendering).
 */
export interface TemplateParameterDefinition {
  /** The refValue name used in the SDK binding. */
  readonly name: string;
  /** UI label for the input field. */
  readonly label: string;
  /** Placeholder text for the input field. */
  readonly placeholder: string;
  /** Which template component this parameter belongs to. */
  readonly component: "header" | "body" | "button";
  /**
   * When set, this value is sent automatically and the field is hidden from the UI.
   * Useful for button URL suffixes or other fixed parameters.
   */
  readonly fixedValue?: string;
}

/**
 * A predefined TheFoggi Consultancy template definition used to populate the demo UI.
 */
export interface PredefinedTemplate {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly templateName: string;
  readonly language: string;
  readonly parameterDefinitions: readonly TemplateParameterDefinition[];
  readonly hasQuickReply: boolean;
  /** Quick Reply button labels (for UI display). */
  readonly quickReplyButtons?: readonly string[];
}

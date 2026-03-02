import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  sendTemplateMessage,
  listChannelTemplates,
} from "../services/messaging.service.js";
import { addMessage } from "../services/conversation.service.js";
import { PREDEFINED_TEMPLATES } from "../data/template-definitions.js";
import {
  ErrorCode,
  MessageDirection,
  type TemplateParameterValue,
  type TemplateBindings,
  type TemplateButtonBinding,
  type MessageTemplate,
} from "../types/index.js";

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

/** Zod schema for the send-template request body. */
const SendTemplateSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^\+\d{10,15}$/,
      "Phone must be E.164 format (e.g., +5511999990001)"
    ),
  templateId: z
    .string()
    .min(1, "Template ID is required"),
  parameters: z.record(z.string()).default({}),
});

/**
 * GET /api/templates
 * Lists all WhatsApp message templates available on the configured channel.
 */
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const templates = await listChannelTemplates();
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error("[Templates] Failed to list:", error);
      res.status(500).json({
        success: false,
        error: {
          code: ErrorCode.TemplateListFailed,
          message:
            error instanceof Error
              ? error.message
              : "Failed to list templates",
        },
      });
    }
  })
);

/**
 * GET /api/templates/predefined
 * Returns the predefined TheFoggi Consultancy template definitions for UI rendering.
 */
router.get(
  "/predefined",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: PREDEFINED_TEMPLATES });
  })
);

/**
 * POST /api/templates/send
 * Sends a predefined template message to a WhatsApp user via ACS.
 */
router.post(
  "/send",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = SendTemplateSchema.safeParse(req.body);

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

    const { phone, templateId, parameters } = parsed.data;

    // Look up the predefined template definition
    const templateDef = PREDEFINED_TEMPLATES.find((t) => t.id === templateId);
    if (!templateDef) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.InvalidInput,
          message: `Unknown template ID: ${templateId}`,
        },
      });
      return;
    }

    // Build the template values array from the user-supplied parameters
    const values: TemplateParameterValue[] = templateDef.parameterDefinitions.map(
      (paramDef) => ({
        kind: "text" as const,
        name: paramDef.name,
        text: paramDef.fixedValue ?? parameters[paramDef.name] ?? "",
      })
    );

    // Build bindings — group refs by component
    const bodyRefs = templateDef.parameterDefinitions
      .filter((p) => p.component === "body")
      .map((p) => ({ refValue: p.name }));
    const headerRefs = templateDef.parameterDefinitions
      .filter((p) => p.component === "header")
      .map((p) => ({ refValue: p.name }));

    // Build button bindings for URL button parameters defined in parameterDefinitions
    const buttonBindings: TemplateButtonBinding[] = [];
    const buttonParams = templateDef.parameterDefinitions.filter(
      (p) => p.component === "button"
    );
    buttonParams.forEach((paramDef) => {
      buttonBindings.push({
        subType: "url" as const,
        refValue: paramDef.name,
      });
    });

    // Add Quick Reply button bindings
    if (templateDef.hasQuickReply && templateDef.quickReplyButtons) {
      templateDef.quickReplyButtons.forEach((label, index) => {
        const payloadName = `QuickReply${index}`;
        values.push({
          kind: "text" as const,
          name: payloadName,
          text: label,
        });
        buttonBindings.push({
          subType: "quickReply" as const,
          refValue: payloadName,
        });
      });
    }

    const bindings: TemplateBindings = {
      kind: "whatsApp",
      ...(bodyRefs.length > 0 ? { body: bodyRefs } : {}),
      ...(headerRefs.length > 0 ? { header: headerRefs } : {}),
      ...(buttonBindings.length > 0 ? { button: buttonBindings } : {}),
    };

    const template: MessageTemplate = {
      name: templateDef.templateName,
      language: templateDef.language,
      values,
      bindings,
    };

    try {
      const messageId = await sendTemplateMessage(phone, template);

      // Build a display-friendly text for the conversation log
      const paramSummary = templateDef.parameterDefinitions
        .map((p) => `${p.label}: ${parameters[p.name] ?? "—"}`)
        .join(", ");
      const displayText = `[Template: ${templateDef.displayName}] ${paramSummary}`;

      addMessage(phone, MessageDirection.Outbound, displayText, messageId, {
        templateName: templateDef.templateName,
      });

      res.status(200).json({
        success: true,
        data: { messageId },
      });
    } catch (error) {
      console.error("[Templates] Failed to send:", error);
      res.status(500).json({
        success: false,
        error: {
          code: ErrorCode.TemplateSendFailed,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send template message",
        },
      });
    }
  })
);

export default router;

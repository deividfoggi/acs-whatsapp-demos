import { Router, Request, Response, NextFunction } from "express";
import { FlowsEndpointRequest, FlowsEndpointResponse } from "../types/index.js";
import { getStudentsByParentPhone } from "../services/student.service.js";
import { getOutstandingFeesByStudentId } from "../services/payment.service.js";

const router = Router();

/**
 * Wraps an async route handler to catch unhandled rejections.
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

/**
 * POST /api/flows/endpoint
 * WhatsApp Flows Data Endpoint.
 * Handles INIT, data_exchange, and BACK actions from WhatsApp Flows.
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as FlowsEndpointRequest;
    const { action, screen, data, flow_token } = body;

    console.log(
      `[Flows] action=${action} screen=${screen ?? "N/A"} flow_token=${flow_token ?? "N/A"}`
    );

    let response: FlowsEndpointResponse;

    switch (action) {
      case "INIT":
        response = await handleInit(flow_token);
        break;

      case "data_exchange":
        response = await handleDataExchange(screen ?? "", data ?? {});
        break;

      case "BACK":
        response = await handleBack(screen ?? "", data ?? {});
        break;

      default:
        console.warn(`[Flows] Unknown action: ${action}`);
        response = {
          screen: "SELECT_STUDENT",
          data: { error_message: "Unknown action" },
        };
    }

    res.json(response);
  })
);

/**
 * Handles the INIT action — returns data for the first screen.
 * The flow_token encodes the parent's phone number.
 */
async function handleInit(
  flowToken?: string
): Promise<FlowsEndpointResponse> {
  // In production, decode the flow_token to get the parent phone
  // For now, use a default phone for demo purposes
  const parentPhone = flowToken ?? "+5511999990001";

  const students = await getStudentsByParentPhone(parentPhone);

  const studentOptions = students.map((s) => ({
    id: s.id,
    title: `${s.name} - ${s.grade}`,
    description: s.schoolName,
  }));

  return {
    screen: "SELECT_STUDENT",
    data: {
      students: studentOptions,
    },
  };
}

/**
 * Handles data_exchange — processes screen submissions and returns next screen data.
 */
async function handleDataExchange(
  screen: string,
  data: Record<string, unknown>
): Promise<FlowsEndpointResponse> {
  switch (screen) {
    case "SELECT_STUDENT": {
      const studentId = data.student_id as string;
      const fees = await getOutstandingFeesByStudentId(studentId);

      const feeOptions = fees.map((f) => ({
        id: f.id,
        title: f.description,
        description: `$${f.amount.toFixed(2)} — due ${f.dueDate}`,
      }));

      return {
        screen: "SELECT_FEE",
        data: {
          student_id: studentId,
          fees: feeOptions,
          has_fees: fees.length > 0,
        },
      };
    }

    case "SELECT_FEE": {
      const feeId = data.fee_id as string;
      const studentId = data.student_id as string;

      // Look up the selected fee for confirmation display
      const fees = await getOutstandingFeesByStudentId(studentId);
      const selectedFee = fees.find((f) => f.id === feeId);

      return {
        screen: "PAYMENT_DETAILS",
        data: {
          student_id: studentId,
          fee_id: feeId,
          fee_description: selectedFee?.description ?? "Unknown fee",
          fee_amount: selectedFee?.amount ?? 0,
          fee_due_date: selectedFee?.dueDate ?? "",
          payment_methods: [
            { id: "credit_card", title: "Credit Card" },
            { id: "bank_transfer", title: "Bank Transfer" },
            { id: "pix", title: "PIX" },
          ],
        },
      };
    }

    default:
      console.warn(`[Flows] Unknown screen for data_exchange: ${screen}`);
      return {
        screen: "SELECT_STUDENT",
        data: { error_message: `Unknown screen: ${screen}` },
      };
  }
}

/**
 * Handles the BACK action — refreshes data for a previous screen.
 */
async function handleBack(
  screen: string,
  data: Record<string, unknown>
): Promise<FlowsEndpointResponse> {
  // For BACK, re-run the same logic as INIT or data_exchange for the target screen
  console.log(`[Flows] BACK to ${screen}`);

  switch (screen) {
    case "SELECT_FEE": {
      return handleDataExchange("SELECT_STUDENT", data);
    }

    default:
      return handleInit(data.flow_token as string | undefined);
  }
}

export default router;

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  processPayment,
  getFeeById,
  getPaymentsByStudentId,
} from "../services/payment.service.js";
import { getStudentById } from "../services/student.service.js";
import { ErrorCode, PaymentMethod } from "../types/index.js";

const router = Router();

/**
 * Wraps an async route handler to catch unhandled rejections.
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

/** Request body schema for processing a payment */
const processPaymentSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  feeId: z.string().min(1, "feeId is required"),
  amount: z.number().positive("amount must be positive"),
  method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({
      message: `method must be one of: ${Object.values(PaymentMethod).join(", ")}`,
    }),
  }),
});

/**
 * POST /api/payments
 * Processes a payment against a fee (dummy — always succeeds).
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = processPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.InvalidInput,
          message: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
      });
      return;
    }

    const { studentId, feeId, amount, method } = parsed.data;

    // Verify student exists
    const student = await getStudentById(studentId);
    if (!student) {
      res.status(404).json({
        success: false,
        error: {
          code: ErrorCode.StudentNotFound,
          message: `Student with ID '${studentId}' not found`,
        },
      });
      return;
    }

    // Verify fee exists
    const fee = await getFeeById(feeId);
    if (!fee) {
      res.status(404).json({
        success: false,
        error: {
          code: ErrorCode.FeeNotFound,
          message: `Fee with ID '${feeId}' not found`,
        },
      });
      return;
    }

    const payment = await processPayment(studentId, feeId, amount, method);

    res.status(201).json({ success: true, data: payment });
  })
);

/** Query params schema for payment history */
const paymentHistorySchema = z.object({
  student_id: z.string().min(1, "student_id is required"),
});

/**
 * GET /api/payments?student_id=stu_001
 * Returns payment history for a student.
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = paymentHistorySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.InvalidInput,
          message: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
      });
      return;
    }

    const payments = await getPaymentsByStudentId(parsed.data.student_id);
    res.json({ success: true, data: payments });
  })
);

export default router;

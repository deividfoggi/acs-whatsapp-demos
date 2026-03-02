import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  getOutstandingFeesByStudentId,
  getAllFeesByStudentId,
} from "../services/payment.service.js";
import { getStudentById } from "../services/student.service.js";
import { ErrorCode } from "../types/index.js";

const router = Router();

/**
 * Wraps an async route handler to catch unhandled rejections.
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

/** Path params schema */
const studentIdSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});

/** Query params schema */
const feesQuerySchema = z.object({
  status: z.enum(["all", "outstanding"]).optional().default("outstanding"),
});

/**
 * GET /api/students/:studentId/fees?status=outstanding
 * Returns fees for a student. Defaults to outstanding fees only.
 */
router.get(
  "/:studentId/fees",
  asyncHandler(async (req: Request, res: Response) => {
    const paramsParsed = studentIdSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.InvalidInput,
          message: paramsParsed.error.issues.map((i) => i.message).join("; "),
        },
      });
      return;
    }

    const queryParsed = feesQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.InvalidInput,
          message: queryParsed.error.issues.map((i) => i.message).join("; "),
        },
      });
      return;
    }

    const student = await getStudentById(paramsParsed.data.studentId);
    if (!student) {
      res.status(404).json({
        success: false,
        error: {
          code: ErrorCode.StudentNotFound,
          message: `Student with ID '${paramsParsed.data.studentId}' not found`,
        },
      });
      return;
    }

    const fees =
      queryParsed.data.status === "all"
        ? await getAllFeesByStudentId(paramsParsed.data.studentId)
        : await getOutstandingFeesByStudentId(paramsParsed.data.studentId);

    res.json({ success: true, data: fees });
  })
);

export default router;

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  getStudentsByParentPhone,
  getStudentById,
} from "../services/student.service.js";
import { ErrorCode } from "../types/index.js";

const router = Router();

/**
 * Wraps an async route handler to catch unhandled rejections.
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

/** Query params schema for listing students by parent phone */
const listStudentsSchema = z.object({
  parent_phone: z
    .string()
    .min(1, "parent_phone is required")
    .regex(/^\+\d{10,15}$/, "parent_phone must be in E.164 format"),
});

/**
 * GET /api/students?parent_phone=+5511999990001
 * Returns all students belonging to a parent.
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = listStudentsSchema.safeParse(req.query);

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

    const students = await getStudentsByParentPhone(parsed.data.parent_phone);

    res.json({ success: true, data: students });
  })
);

/** Path params schema for student ID */
const studentIdSchema = z.object({
  id: z.string().min(1, "Student ID is required"),
});

/**
 * GET /api/students/:id
 * Returns a single student by ID.
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = studentIdSchema.safeParse(req.params);

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

    const student = await getStudentById(parsed.data.id);

    if (!student) {
      res.status(404).json({
        success: false,
        error: {
          code: ErrorCode.StudentNotFound,
          message: `Student with ID '${parsed.data.id}' not found`,
        },
      });
      return;
    }

    res.json({ success: true, data: student });
  })
);

export default router;

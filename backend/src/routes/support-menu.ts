import { Router, Request, Response, NextFunction } from "express";
import {
  isSupportMenuEnabled,
  setSupportMenuEnabled,
} from "../services/support-menu.service.js";

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

/**
 * GET /api/support-menu/status
 * Returns whether the support menu auto-reply mode is currently active.
 */
router.get(
  "/status",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: { enabled: isSupportMenuEnabled() },
    });
  })
);

/**
 * POST /api/support-menu/toggle
 * Enables or disables the support menu auto-reply mode.
 * Body: { "enabled": true | false }
 */
router.post(
  "/toggle",
  asyncHandler(async (req: Request, res: Response) => {
    const { enabled } = req.body as { enabled?: boolean };

    if (typeof enabled !== "boolean") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: '"enabled" must be a boolean',
        },
      });
      return;
    }

    setSupportMenuEnabled(enabled);

    res.json({
      success: true,
      data: { enabled: isSupportMenuEnabled() },
    });
  })
);

export default router;

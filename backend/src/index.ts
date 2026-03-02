import express from "express";
import { join } from "node:path";
import { CONFIG, validateConfig } from "./config.js";
import studentsRouter from "./routes/students.js";
import feesRouter from "./routes/fees.js";
import paymentsRouter from "./routes/payments.js";
import webhooksRouter from "./routes/webhooks.js";
import flowsRouter from "./routes/flows.js";
import messagesRouter from "./routes/messages.js";
import templatesRouter from "./routes/templates.js";

// Validate environment variables on startup
validateConfig();

const app = express();

// Resolve path to public/ directory (works in both src/ and dist/)
const publicPath = join(__dirname, "public");

// Middleware
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public config endpoint — exposes non-sensitive settings for the frontend
app.get("/api/config", (_req, res) => {
  res.json({
    success: true,
    data: { companyName: CONFIG.COMPANY_NAME },
  });
});

// API Routes
app.use("/api/students", studentsRouter);
app.use("/api/students", feesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/webhooks/acs", webhooksRouter);
app.use("/api/flows/endpoint", flowsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/templates", templatesRouter);

// Static files (demo UI) — mounted after API routes
app.use(express.static(publicPath));

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(`[Error] ${err.message}`, err.stack);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          CONFIG.NODE_ENV === "production"
            ? "An internal error occurred"
            : err.message,
      },
    });
  }
);

// Start server
app.listen(CONFIG.PORT, () => {
  console.log(
    `🚀 ${CONFIG.COMPANY_NAME} API running on port ${CONFIG.PORT} (${CONFIG.NODE_ENV})`
  );
  console.log(`   Health: http://localhost:${CONFIG.PORT}/api/health`);
  console.log(`   Demos:  http://localhost:${CONFIG.PORT}/`);
});

export default app;

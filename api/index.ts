import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "../backend/src/config/db";
import authRoutes from "../backend/src/routes/authRoutes";
import patientRoutes from "../backend/src/routes/patientRoutes";
import psychologistRoutes from "../backend/src/routes/psychologistRoutes";
import appointmentRoutes from "../backend/src/routes/appointmentRoutes";
import reportRoutes from "../backend/src/routes/reportRoutes";
import batchRoutes from "../backend/src/routes/batchRoutes";
import dashboardRoutes from "../backend/src/routes/dashboardRoutes";
import { errorHandler } from "../backend/src/middlewares/errorMiddleware";

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Allow large payloads for base64 photo/signature uploads

// Lazy initialize Database connection on first request
let dbInitialized = false;
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  if (!dbInitialized) {
    try {
      console.log("[serverless] Verifying database connection...");
      await pool.query("SELECT 1");
      dbInitialized = true;
      console.log("[serverless] Database connection verified successfully.");
    } catch (err) {
      console.error("[serverless] Database connection verification failed:", err);
    }
  }
  next();
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/psychologists", psychologistRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Asisya IHMS Backend API is running on Vercel Serverless",
    timestamp: new Date().toISOString(),
  });
});

// Default fallback route
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: "Serverless route not found",
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;

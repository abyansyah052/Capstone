import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./config/db";
import authRoutes from "./routes/authRoutes";
import patientRoutes from "./routes/patientRoutes";
import psychologistRoutes from "./routes/psychologistRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import reportRoutes from "./routes/reportRoutes";
import batchRoutes from "./routes/batchRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { errorHandler } from "./middlewares/errorMiddleware";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050; // default to port 5050 as user runs on it

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Allow large payloads for base64 photo/signature uploads

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/psychologists", psychologistRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Asisya IHMS Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// Default fallback route
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: "Route not found",
  });
});

// Centralized error handler
app.use(errorHandler);

// Initialize DB and start server
const startServer = async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`[server] Server is running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("[server] Failed to start server:", err);
});

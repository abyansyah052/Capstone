import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5050,
  env: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};

import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[error] Error occurred: ${err.message}`);
  res.status(500).json({
    ok: false,
    error: err.message || "Internal Server Error",
  });
};

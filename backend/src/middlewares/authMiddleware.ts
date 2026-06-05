import { Request, Response, NextFunction } from "express";

// Extend Request interface to hold authenticated user details
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const userId = req.headers["x-user-id"] as string;
  const userRole = req.headers["x-user-role"] as string;
  const userEmail = req.headers["x-user-email"] as string;
  const userName = req.headers["x-user-name"] as string;

  if (!userId || !userRole || !userEmail) {
    res.status(401).json({
      ok: false,
      error: "Authentication credentials missing in request headers",
    });
    return;
  }

  req.user = {
    id: userId,
    role: userRole,
    email: userEmail,
    name: userName || "User",
  };

  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        ok: false,
        error: `Forbidden: User role '${req.user.role}' is not authorized to access this resource`,
      });
      return;
    }

    next();
  };
};

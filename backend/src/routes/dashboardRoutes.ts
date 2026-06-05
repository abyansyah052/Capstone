import { Router, Response } from "express";
import { query } from "../config/db";
import { requireAuth, AuthenticatedRequest } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get today's date in local server YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];

    const patientsCountResult = await query("SELECT COUNT(*) FROM patients");
    const todayAppointmentsResult = await query("SELECT COUNT(*) FROM appointments WHERE date = $1", [today]);
    const internalAppointmentsResult = await query("SELECT COUNT(*) FROM appointments WHERE visible_to_regular = false");

    res.json({
      ok: true,
      data: {
        totalPatients: parseInt(patientsCountResult.rows[0].count) || 0,
        todayAppointments: parseInt(todayAppointmentsResult.rows[0].count) || 0,
        internalAppointments: parseInt(internalAppointmentsResult.rows[0].count) || 0,
      }
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;

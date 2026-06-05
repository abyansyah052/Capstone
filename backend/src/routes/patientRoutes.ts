import { Router } from "express";
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// Apply authentication to all patient routes
router.use(requireAuth);

router.get("/", requireRole(["staff", "psikolog", "apex"]), getAllPatients);
router.get("/:id", requireRole(["staff", "psikolog"]), getPatientById);
router.post("/", requireRole(["staff", "psikolog"]), createPatient);
router.put("/:id", requireRole(["staff"]), updatePatient);
router.delete("/:id", requireRole(["staff"]), deletePatient);

export default router;

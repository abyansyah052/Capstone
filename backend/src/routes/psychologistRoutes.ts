import { Router } from "express";
import {
  getAllPsychologists,
  getPsychologistById,
  createPsychologist,
  updatePsychologist,
  deletePsychologist,
} from "../controllers/psychologistController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// Apply authentication
router.use(requireAuth);

router.get("/", requireRole(["staff", "apex", "psikolog"]), getAllPsychologists);
router.get("/:id", requireRole(["staff", "apex"]), getPsychologistById);
router.post("/", requireRole(["staff", "apex"]), createPsychologist);
router.put("/:id", requireRole(["staff", "apex"]), updatePsychologist);
router.delete("/:id", requireRole(["staff", "apex"]), deletePsychologist);

export default router;

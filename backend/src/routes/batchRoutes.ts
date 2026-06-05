import { Router } from "express";
import { getAllBatches, createBatch, deleteBatch } from "../controllers/batchController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// Secure all batch endpoints with authentication
router.use(requireAuth);

router.get("/", getAllBatches);
router.post("/", requireRole(["staff"]), createBatch);
router.delete("/:id", requireRole(["staff"]), deleteBatch);

export default router;

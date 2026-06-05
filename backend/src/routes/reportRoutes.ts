import { Router } from "express";
import {
  getAllReportNodes,
  getCounselingReports,
  createReportNode,
  updateReportNode,
  deleteReportNode,
  deleteReportNodesBulk,
  previewOrDownloadPdf,
  batchDownloadReports,
} from "../controllers/reportController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// Secure all report bank endpoints with authentication
router.use(requireAuth);

router.get("/", requireRole(["psikolog", "staff", "apex"]), getAllReportNodes);
router.get("/counseling", requireRole(["psikolog", "staff", "apex"]), getCounselingReports);
router.post("/", requireRole(["psikolog"]), createReportNode);
router.put("/:id", requireRole(["psikolog"]), updateReportNode);
router.post("/bulk-delete", requireRole(["psikolog"]), deleteReportNodesBulk);
router.delete("/:id", requireRole(["psikolog"]), deleteReportNode);
router.get("/:id/pdf", requireRole(["psikolog", "staff", "apex"]), previewOrDownloadPdf);
router.post("/batch-download", requireRole(["psikolog", "staff", "apex"]), batchDownloadReports);

export default router;

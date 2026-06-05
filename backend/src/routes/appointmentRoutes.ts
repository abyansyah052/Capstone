import { Router } from "express";
import {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/", getAllAppointments);
router.post("/", createAppointment);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

export default router;

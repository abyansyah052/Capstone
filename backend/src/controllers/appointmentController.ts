import { Response } from "express";
import { query, logActivity } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { sendNotification } from "../services/notificationService";

const formatDate = (val: any): string => {
  if (!val) return "";
  if (val instanceof Date) {
    const offset = val.getTimezoneOffset();
    const localDate = new Date(val.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0] || "";
  }
  if (typeof val === "string") {
    if (val.includes("T")) {
      return val.split("T")[0] || "";
    }
    return val;
  }
  return String(val);
};

// GET /api/appointments - Retrieve appointments
export const getAllAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const role = req.user?.role;
  try {
    let result;
    if (role === "reguler") {
      // Regular users can only see appointments marked visible to them
      result = await query("SELECT * FROM appointments WHERE visible_to_regular = true ORDER BY date DESC, time_slot DESC");
    } else if (role === "psikolog") {
      // Psychologists can only see their own appointments + internal/general meetings
      const psyResult = await query("SELECT id FROM psychologists WHERE user_id = $1", [req.user?.id]);
      let psyId = "";
      if (psyResult.rows.length > 0) {
        psyId = psyResult.rows[0].id;
      } else {
        const psyEmailResult = await query("SELECT id FROM psychologists WHERE email = $1", [req.user?.email]);
        if (psyEmailResult.rows.length > 0) {
          psyId = psyEmailResult.rows[0].id;
        }
      }

      if (psyId) {
        result = await query(
          "SELECT * FROM appointments WHERE ($1 = ANY(string_to_array(psychologist_id, ',')) OR patient_id = 'INTERNAL') ORDER BY date DESC, time_slot DESC",
          [psyId]
        );
      } else {
        result = { rows: [] };
      }
    } else {
      // apex or staff can see all appointments
      result = await query("SELECT * FROM appointments ORDER BY date DESC, time_slot DESC");
    }

    // Map DB fields back to frontend structure
    const mapped = result.rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      date: formatDate(row.date),
      time: row.time_slot,
      duration: Number(row.duration) || 60,
      doctorId: row.psychologist_id,
      type: row.type || "Konsultasi Umum",
      status: row.status,
      notes: row.notes || "",
      notify: row.notify || "none",
      notifyPhone: row.notify_phone || "",
      notifyEmail: row.notify_email || "",
      visibleToRegular: !!row.visible_to_regular,
    }));

    res.json({ ok: true, data: mapped });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/appointments - Schedule a new appointment
export const createAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = req.body;

  const isInternal = data.patientId === "INTERNAL";
  if (!data.patientName || !data.date || !data.time || (!isInternal && !data.doctorId)) {
    res.status(400).json({ ok: false, error: "Missing required appointment scheduling parameters" });
    return;
  }

  const id = data.id || `appt-${Date.now()}`;
  const duration = Number(data.duration) || 60;
  const visibleToRegular = data.visibleToRegular === true || data.visibleToRegular === "true";

  try {
    let resolvedPatientId = null;
    if (data.patientId && data.patientId !== "INTERNAL") {
      const patientResult = await query(
        "SELECT id FROM patients WHERE phone = $1 OR id = $2 LIMIT 1",
        [data.patientId.trim(), data.patientId.trim()]
      );
      if (patientResult.rows.length > 0) {
        resolvedPatientId = patientResult.rows[0].id;
      }
    }

    await query(
      `INSERT INTO appointments (
        id, patient_id, patient_name, psychologist_id, date, time_slot, duration,
        type, status, notes, notify, notify_phone, notify_email, visible_to_regular
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        resolvedPatientId,
        data.patientName,
        data.doctorId || null,
        data.date,
        data.time,
        duration,
        data.type || "Konsultasi",
        data.status || "scheduled",
        data.notes || "",
        data.notify || "none",
        data.notifyPhone || "",
        data.notifyEmail || "",
        visibleToRegular,
      ]
    );

    // Write Log
    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "APPOINTMENT_SCHEDULE",
      `Scheduled appointment for ${data.patientName} on ${data.date} at ${data.time}. Regular Visible: ${visibleToRegular}`
    );

    // Simulate Notification dispatch
    if (data.notify && data.notify !== "none") {
      if (isInternal && data.doctorId) {
        // Notify each psychologist assigned to the internal schedule
        const psyIds = data.doctorId.split(",").map((s: string) => s.trim()).filter(Boolean);
        for (const psyId of psyIds) {
          const psyRes = await query("SELECT name, email, phone FROM psychologists WHERE id = $1", [psyId]);
          if (psyRes.rows.length > 0) {
            const psy = psyRes.rows[0];
            await sendNotification({
              patientName: `${data.patientName} (Jadwal Internal - ${psy.name})`,
              date: data.date,
              time: data.time,
              channel: data.notify,
              phone: psy.phone || "",
              email: psy.email || "",
            });
          }
        }
      } else {
        // Standard patient notification
        await sendNotification({
          patientName: data.patientName,
          date: data.date,
          time: data.time,
          channel: data.notify,
          phone: data.notifyPhone,
          email: data.notifyEmail,
        });
      }
    }

    res.status(201).json({ ok: true, message: "Appointment scheduled successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/appointments/:id - Update appointment status or info
export const updateAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const data = req.body;

  try {
    const checkResult = await query("SELECT * FROM appointments WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Appointment not found" });
      return;
    }

    const current = checkResult.rows[0];

    await query(
      `UPDATE appointments SET
        patient_name = $1, date = $2, time_slot = $3, duration = $4,
        psychologist_id = $5, type = $6, status = $7, notes = $8,
        notify = $9, notify_phone = $10, notify_email = $11, visible_to_regular = $12
      WHERE id = $13`,
      [
        data.patientName || current.patient_name,
        data.date || current.date,
        data.time || current.time_slot,
        data.duration !== undefined ? Number(data.duration) : current.duration,
        data.doctorId || current.psychologist_id,
        data.type || current.type,
        data.status || current.status,
        data.notes !== undefined ? data.notes : current.notes,
        data.notify || current.notify,
        data.notifyPhone !== undefined ? data.notifyPhone : current.notify_phone,
        data.notifyEmail !== undefined ? data.notifyEmail : current.notify_email,
        data.visibleToRegular !== undefined ? (data.visibleToRegular === true || data.visibleToRegular === "true") : current.visible_to_regular,
        id,
      ]
    );

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "APPOINTMENT_UPDATE",
      `Updated appointment for ${data.patientName || current.patient_name} (ID: ${id})`
    );

    res.json({ ok: true, message: "Appointment updated successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE /api/appointments/:id - Cancel/Delete appointment
export const deleteAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const checkResult = await query("SELECT * FROM appointments WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Appointment not found" });
      return;
    }

    await query("DELETE FROM appointments WHERE id = $1", [id]);

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "APPOINTMENT_DELETE",
      `Cancelled/Deleted appointment ID: ${id}`
    );

    res.json({ ok: true, message: "Appointment deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

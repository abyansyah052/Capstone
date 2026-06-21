import { Response } from "express";
import { query, logActivity } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

// GET /api/psychologists - Get all psychologists
export const getAllPsychologists = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await query("SELECT * FROM psychologists ORDER BY created_at DESC");
    res.json({ ok: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// GET /api/psychologists/:id - Get psychologist by ID
export const getPsychologistById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query("SELECT * FROM psychologists WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Psychologist not found" });
      return;
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/psychologists - Create psychologist
export const createPsychologist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const psyData = req.body;

  if (!psyData.name || !psyData.email || !psyData.sipp) {
    res.status(400).json({ ok: false, error: "Missing required fields: name, email, sipp" });
    return;
  }

  const id = psyData.id || `psy-${Date.now()}`;
  const age = Number(psyData.age) || 0;

  try {
    await query(
      `INSERT INTO psychologists (id, user_id, name, email, sipp, origin, age, phone, address, signature)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        psyData.userId || null,
        psyData.name,
        psyData.email,
        psyData.sipp,
        psyData.origin || "",
        age,
        psyData.phone || "",
        psyData.address || "",
        psyData.signature || null,
      ]
    );

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "PSYCHOLOGIST_CREATE",
      `Registered psychologist profile: ${psyData.name} (SIPP: ${psyData.sipp})`
    );

    const createdResult = await query("SELECT * FROM psychologists WHERE id = $1", [id]);
    res.status(201).json({ ok: true, data: createdResult.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/psychologists/:id - Update psychologist profile
export const updatePsychologist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const psyData = req.body;

  try {
    const checkResult = await query("SELECT * FROM psychologists WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Psychologist not found" });
      return;
    }

    const currentPsy = checkResult.rows[0];
    const age = psyData.age !== undefined ? Number(psyData.age) : currentPsy.age;

    await query(
      `UPDATE psychologists SET
        name = $1, email = $2, sipp = $3, origin = $4, age = $5, phone = $6,
        address = $7, signature = $8
      WHERE id = $9`,
      [
        psyData.name || currentPsy.name,
        psyData.email || currentPsy.email,
        psyData.sipp || currentPsy.sipp,
        psyData.origin || currentPsy.origin,
        age,
        psyData.phone || currentPsy.phone,
        psyData.address || currentPsy.address,
        psyData.signature !== undefined ? psyData.signature : currentPsy.signature,
        id,
      ]
    );

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "PSYCHOLOGIST_UPDATE",
      `Updated psychologist profile: ${psyData.name || currentPsy.name} (ID: ${id})`
    );

    const updatedResult = await query("SELECT * FROM psychologists WHERE id = $1", [id]);
    res.json({ ok: true, data: updatedResult.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE /api/psychologists/:id - Delete psychologist profile
export const deletePsychologist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const checkResult = await query("SELECT * FROM psychologists WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Psychologist not found" });
      return;
    }

    const psy = checkResult.rows[0];

    // If associated with a user, we can demote the user back to reguler
    if (psy.user_id) {
      await query("UPDATE users SET role = 'reguler' WHERE id = $1", [psy.user_id]);
    }

    await query("DELETE FROM psychologists WHERE id = $1", [id]);

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "PSYCHOLOGIST_DELETE",
      `Deleted psychologist profile: ${psy.name} (ID: ${id})`
    );

    res.json({ ok: true, message: "Psychologist deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

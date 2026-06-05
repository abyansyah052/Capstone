import { Response } from "express";
import { query, logActivity } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

// GET /api/batches - Get all batches (including soft deleted for historical rendering)
export const getAllBatches = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query("SELECT id, name, company, color, deleted FROM batches ORDER BY id ASC");
    res.json({ ok: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/batches - Create batch (staff only)
export const createBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id, name, company, color } = req.body;

  if (!id || !name || !company || !color) {
    res.status(400).json({ ok: false, error: "Missing required fields: id, name, company, color" });
    return;
  }

  try {
    // Check if the batch ID already exists (active or deleted)
    const check = await query("SELECT * FROM batches WHERE id = $1", [id]);
    if (check.rows.length > 0) {
      const existing = check.rows[0];
      if (existing.deleted) {
        // Reactivate soft-deleted batch with new fields
        await query(
          "UPDATE batches SET name = $1, company = $2, color = $3, deleted = false WHERE id = $4",
          [name, company, color, id]
        );
        await logActivity(
          req.user?.id || "system",
          req.user?.email || "system@asisya.com",
          "BATCH_REACTIVATE",
          `Reactivated batch ${id} (${name})`
        );
        res.status(200).json({ ok: true, data: { id, name, company, color } });
        return;
      } else {
        res.status(400).json({ ok: false, error: `Batch dengan ID '${id}' sudah terdaftar.` });
        return;
      }
    }

    await query(
      "INSERT INTO batches (id, name, company, color, deleted) VALUES ($1, $2, $3, $4, false)",
      [id, name, company, color]
    );

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "BATCH_CREATE",
      `Created batch ${id} (${name})`
    );

    res.status(201).json({ ok: true, data: { id, name, company, color } });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE /api/batches/:id - Soft delete batch (staff only)
export const deleteBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const check = await query("SELECT * FROM batches WHERE id = $1 AND deleted = false", [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Batch not found or already deleted" });
      return;
    }

    const batch = check.rows[0];
    await query("UPDATE batches SET deleted = true WHERE id = $1", [id]);

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "BATCH_DELETE",
      `Soft deleted batch: ${batch.name} (ID: ${id})`
    );

    res.json({ ok: true, message: "Batch deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

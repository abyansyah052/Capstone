import { Response } from "express";
import { query, logActivity } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

// GET /api/batches - Get all batches (including soft deleted for historical rendering)
export const getAllBatches = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, name, company, color, deleted, logo, use_logo_in_report as "useLogoInReport", logo_scale as "logoScale" 
       FROM batches 
       ORDER BY id ASC`
    );
    res.json({ ok: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/batches - Create batch (staff only)
export const createBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id, name, company, color, logo, useLogoInReport, logoScale } = req.body;

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
          `UPDATE batches 
           SET name = $1, company = $2, color = $3, logo = $4, use_logo_in_report = $5, logo_scale = $6, deleted = false 
           WHERE id = $7`,
          [
            name,
            company,
            color,
            logo || null,
            !!useLogoInReport,
            logoScale !== undefined ? logoScale : 1.0,
            id,
          ]
        );
        await logActivity(
          req.user?.id || "system",
          req.user?.email || "system@asisya.com",
          "BATCH_REACTIVATE",
          `Reactivated batch ${id} (${name})`
        );
        res.status(200).json({
          ok: true,
          data: {
            id,
            name,
            company,
            color,
            deleted: false,
            logo: logo || null,
            useLogoInReport: !!useLogoInReport,
            logoScale: logoScale !== undefined ? logoScale : 1.0,
          },
        });
        return;
      } else {
        res.status(400).json({ ok: false, error: `Batch dengan ID '${id}' sudah terdaftar.` });
        return;
      }
    }

    await query(
      `INSERT INTO batches (id, name, company, color, logo, use_logo_in_report, logo_scale, deleted) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
      [
        id,
        name,
        company,
        color,
        logo || null,
        !!useLogoInReport,
        logoScale !== undefined ? logoScale : 1.0,
      ]
    );

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "BATCH_CREATE",
      `Created batch ${id} (${name})`
    );

    res.status(201).json({
      ok: true,
      data: {
        id,
        name,
        company,
        color,
        deleted: false,
        logo: logo || null,
        useLogoInReport: !!useLogoInReport,
        logoScale: logoScale !== undefined ? logoScale : 1.0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/batches/:id - Update batch (staff only)
export const updateBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, company, color, logo, useLogoInReport, logoScale } = req.body;

  if (!name || !company || !color) {
    res.status(400).json({ ok: false, error: "Missing required fields: name, company, color" });
    return;
  }

  try {
    const check = await query("SELECT * FROM batches WHERE id = $1 AND deleted = false", [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Batch tidak ditemukan atau sudah dihapus." });
      return;
    }

    await query(
      `UPDATE batches 
       SET name = $1, company = $2, color = $3, logo = $4, use_logo_in_report = $5, logo_scale = $6 
       WHERE id = $7`,
      [
        name,
        company,
        color,
        logo !== undefined ? logo : null,
        !!useLogoInReport,
        logoScale !== undefined ? logoScale : 1.0,
        id,
      ]
    );

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "BATCH_UPDATE",
      `Updated batch ${id} (${name})`
    );

    res.json({
      ok: true,
      data: {
        id,
        name,
        company,
        color,
        deleted: false,
        logo: logo !== undefined ? logo : null,
        useLogoInReport: !!useLogoInReport,
        logoScale: logoScale !== undefined ? logoScale : 1.0,
      },
    });
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

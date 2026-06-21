import { Response } from "express";
import * as PDFDocumentModule from "pdfkit";
import * as archiverModule from "archiver";
const PDFDocument = ((PDFDocumentModule as any).default || PDFDocumentModule) as any;
const archiver = ((archiverModule as any).default || archiverModule) as any;
import { query, logActivity } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

// Helper to generate dynamic PDF buffer using pdfkit
const generatePdfBuffer = async (
  form: any,
  signatureBase64: string | null,
  psyName: string,
  sipp: string
): Promise<Buffer> => {
  // Query batch logo first if patientId is present
  let batchLogo: string | null = null;
  let useLogoInReport = false;
  let logoScale = 1.0;
  if (form.patientId) {
    try {
      const patientRes = await query("SELECT batch_id FROM patients WHERE id = $1", [form.patientId]);
      if (patientRes.rows.length > 0 && patientRes.rows[0].batch_id) {
        const batchRes = await query("SELECT logo, use_logo_in_report, logo_scale FROM batches WHERE id = $1", [patientRes.rows[0].batch_id]);
        if (batchRes.rows.length > 0) {
          batchLogo = batchRes.rows[0].logo;
          useLogoInReport = !!batchRes.rows[0].use_logo_in_report;
          logoScale = parseFloat(batchRes.rows[0].logo_scale || "1.0");
        }
      }
    } catch (e) {
      console.error("Error looking up batch logo for PDF report:", e);
    }
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: any) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: any) => reject(err));

    // Draw Right Logo if enabled
    if (useLogoInReport && batchLogo && batchLogo.startsWith("data:image")) {
      try {
        const base64Data = batchLogo.replace(/^data:image\/\w+;base64,/, "");
        const logoBuffer = Buffer.from(base64Data, "base64");
        // Place it on top right corner, sizing and positioning based on logoScale
        const size = 50 * logoScale;
        const logoX = 545 - size;
        doc.image(logoBuffer, logoX, 45, { width: size, height: size, fit: [size, size] });
      } catch (errImg) {
        console.error("Error drawing batch logo in PDF:", errImg);
      }
    }

    // Header Title
    doc.fontSize(14).font("Helvetica-Bold").text("ASISYA PSYCHOLOGICAL CENTER", { align: "center" });
    doc.fontSize(8).font("Helvetica").text("Ruko Grand City Regency A7 - A8 Jl. Rungkut Madya", { align: "center" });
    doc.text("Surabaya - Jawa Timur", { align: "center" });
    doc.moveDown(0.5);

    // Divider Line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#111827").lineWidth(1.5).stroke();
    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("FORM KONSELING PSIKOLOGIS", { align: "center" });
    doc.moveDown(1);

    // Section: Biodata
    doc.fontSize(10).font("Helvetica-Bold").text("Biodata");
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#6b7280").lineWidth(1).stroke();
    doc.moveDown(0.5);

    const leftColX = 50;
    const rightColX = 200;

    const drawRow = (label: string, val: string) => {
      const currentY = doc.y;
      doc.fontSize(9).font("Helvetica-Bold").text(label, leftColX, currentY, { width: 140 });
      doc.font("Helvetica").text(val || "—", rightColX, currentY);
      doc.moveDown(0.3);
    };

    drawRow("Nama Lengkap:", form.namaLengkap);
    drawRow("Tempat/Tanggal Lahir:", `${form.tempatLahir || "—"}${form.tempatLahir && form.tanggalLahir ? " / " : ""}${form.tanggalLahir || ""}`);
    drawRow("Jenis Kelamin:", form.jenisKelamin);
    drawRow("Usia:", form.usia ? `${form.usia} Tahun` : "—");
    drawRow("Pendidikan Terakhir:", form.pendidikan);
    drawRow("Anak Keberapa:", form.anakKeberapa || form.jumlahSaudara ? `Anak ke ${form.anakKeberapa || "—"} dari ${form.jumlahSaudara || "—"} bersaudara` : "—");
    drawRow("Alamat:", form.alamat);
    doc.moveDown(0.5);

    const drawSection = (title: string, text: string) => {
      doc.fontSize(10).font("Helvetica-Bold").text(title, leftColX);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#6b7280").lineWidth(1).stroke();
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica").text(text || "—", { align: "justify", lineGap: 3 });
      doc.moveDown(1);
    };

    drawSection("Permasalahan Saat Ini", form.permasalahan);
    drawSection("Proses Konseling", form.prosesKonseling);
    drawSection("Diagnosis Klinis", form.diagnosisKlinis);
    drawSection("Saran Pengembangan dan Intervensi", form.saranPengembangan);

    // Footer Signature block
    doc.moveDown(1);
    const rightAlignX = 350;
    const today = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    doc.fontSize(9).font("Helvetica").text(`Surabaya, ${today}`, rightAlignX, doc.y, { align: "center", width: 200 });
    doc.text("Psikolog / Konselor", { align: "center", width: 200 });
    doc.moveDown(0.2);

    if (signatureBase64 && signatureBase64.startsWith("data:image")) {
      try {
        const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        doc.image(imageBuffer, rightAlignX + 50, doc.y, { height: 40 });
        doc.moveDown(2.5);
      } catch (e) {
        doc.moveDown(3);
      }
    } else {
      doc.moveDown(3);
    }

    doc.font("Helvetica-Bold").text(`( ${psyName || "Dairy Team"} )`, { align: "center", width: 200 });
    if (sipp) {
      doc.fontSize(8).font("Helvetica-Oblique").fillColor("#6b7280").text(`No. SIPP: ${sipp}`, { align: "center", width: 200 });
    }

    doc.end();
  });
};

// GET /api/reports/nodes - Get all nodes (folders & files)
export const getAllReportNodes = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query("SELECT id, name, kind, parent_id as \"parentId\", mime_type as \"mimeType\", size, created_at as \"createdAt\" FROM report_nodes ORDER BY created_at DESC");
    res.json({ ok: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/reports/nodes - Create node (folder/file)
export const createReportNode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id, name, kind, parentId, mimeType, size, fileContent, createdAt } = req.body;

  if (!id || !name || !kind) {
    res.status(400).json({ ok: false, error: "Missing required node attributes: id, name, kind" });
    return;
  }

  const createdDate = createdAt || new Date().toLocaleDateString("id-ID");

  try {
    await query(
      "INSERT INTO report_nodes (id, name, kind, parent_id, mime_type, size, file_content, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, name, kind, parentId || null, mimeType || null, size || null, fileContent || null, createdDate]
    );

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      kind === "folder" ? "REPORT_FOLDER_CREATE" : "REPORT_FILE_CREATE",
      `Created report explorer node: ${name} (Kind: ${kind}, ID: ${id})`
    );

    const created = await query("SELECT id, name, kind, parent_id as \"parentId\", mime_type as \"mimeType\", size, created_at as \"createdAt\" FROM report_nodes WHERE id = $1", [id]);
    res.status(201).json({ ok: true, data: created.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/reports/nodes/:id - Rename node
export const updateReportNode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ ok: false, error: "Missing name parameter" });
    return;
  }

  try {
    const check = await query("SELECT * FROM report_nodes WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Explorer node not found" });
      return;
    }

    await query("UPDATE report_nodes SET name = $1 WHERE id = $2", [name, id]);
    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "REPORT_NODE_RENAME",
      `Renamed explorer node ${id} to "${name}"`
    );

    res.json({ ok: true, message: "Node renamed successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE /api/reports/nodes/:id - Delete node (recursively deletes children via CASCADE)
export const deleteReportNode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const check = await query("SELECT * FROM report_nodes WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Explorer node not found" });
      return;
    }

    const node = check.rows[0];

    await query("DELETE FROM report_nodes WHERE id = $1", [id]);
    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "REPORT_NODE_DELETE",
      `Deleted explorer node: ${node.name} (Kind: ${node.kind}, ID: ${id})`
    );

    res.json({ ok: true, message: "Node deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/reports/nodes/bulk-delete - Delete multiple nodes
export const deleteReportNodesBulk = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ ok: false, error: "Missing array of ids" });
    return;
  }

  try {
    await query("DELETE FROM report_nodes WHERE id = ANY($1)", [ids]);
    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "REPORT_NODE_BULK_DELETE",
      `Bulk deleted ${ids.length} explorer nodes`
    );

    res.json({ ok: true, message: "Nodes bulk deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// GET /api/reports/nodes/:id/pdf - Preview or Download PDF file
export const previewOrDownloadPdf = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await query("SELECT * FROM report_nodes WHERE id = $1", [id]);
    if (result.rows.length === 0 || result.rows[0].kind !== "file") {
      res.status(404).json({ ok: false, error: "Report file not found" });
      return;
    }

    const node = result.rows[0];
    const fileContent = node.file_content || "";
    const isDownload = req.query.download === "true";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${isDownload ? "attachment" : "inline"}; filename="${node.name}"`);

    // Case 1: Uploaded direct PDF (stored as base64 string starting with data:application/pdf;base64)
    if (fileContent.startsWith("data:application/pdf;base64,")) {
      const base64Data = fileContent.replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      res.send(buffer);
      return;
    }

    // Case 2: Generated counseling report (stored as JSON form fields)
    let formFields = {};
    try {
      formFields = JSON.parse(fileContent);
    } catch (e) {
      formFields = { namaLengkap: node.name.replace("Laporan_", "").replace(".pdf", "") };
    }

    // Fetch psychologist details for drawing signatures
    // Defaults to Dairy Team if user details are missing
    let signature = null;
    let psyName = "Dairy Team";
    let sipp = "SIPP/09/2026/01-DT";

    // Query active psychologist details if req.user is valid and role is psychologist
    if (req.user?.role === "psikolog") {
      const psyResult = await query("SELECT * FROM psychologists WHERE user_id = $1", [req.user.id]);
      if (psyResult.rows.length > 0) {
        const p = psyResult.rows[0];
        signature = p.signature;
        psyName = p.name;
        sipp = p.sipp || "";
      }
    } else {
      // Fallback: search for first seeded psychologist
      const fallbackResult = await query("SELECT * FROM psychologists ORDER BY created_at ASC LIMIT 1");
      if (fallbackResult.rows.length > 0) {
        const p = fallbackResult.rows[0];
        signature = p.signature;
        psyName = p.name;
        sipp = p.sipp || "";
      }
    }

    const pdfBuffer = await generatePdfBuffer(formFields, signature, psyName, sipp);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/reports/nodes/batch-download - ZIP download of selected folders & files
export const batchDownloadReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ ok: false, error: "Missing array of ids to batch download" });
    return;
  }

  try {
    // Retrieve all nodes in database to build paths
    const dbNodesResult = await query("SELECT id, name, kind, parent_id as \"parentId\", file_content as \"fileContent\" FROM report_nodes");
    const dbNodes = dbNodesResult.rows;

    const nodeMap = new Map<string, any>();
    dbNodes.forEach((n) => nodeMap.set(n.id, n));

    const archive = archiver("zip", { zlib: { level: 9 } });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="counseling_reports_batch.zip"');

    archive.on("error", (err: any) => {
      throw err;
    });

    archive.pipe(res);

    // Fetch psychologist details for signature fallback
    let signature = null;
    let psyName = "Dairy Team";
    let sipp = "SIPP/09/2026/01-DT";
    const fallbackResult = await query("SELECT * FROM psychologists ORDER BY created_at ASC LIMIT 1");
    if (fallbackResult.rows.length > 0) {
      const p = fallbackResult.rows[0];
      signature = p.signature;
      psyName = p.name;
      sipp = p.sipp || "";
    }

    // Helper to recursively zip a folder
    const addFolderToArchive = async (folderId: string, currentZipPath: string) => {
      const children = dbNodes.filter((n) => n.parentId === folderId);
      for (const child of children) {
        const nextPath = `${currentZipPath}/${child.name}`;
        if (child.kind === "folder") {
          await addFolderToArchive(child.id, nextPath);
        } else {
          const fileContent = child.fileContent || "";
          let buffer: Buffer;

          if (fileContent.startsWith("data:application/pdf;base64,")) {
            const base64Data = fileContent.replace(/^data:application\/pdf;base64,/, "");
            buffer = Buffer.from(base64Data, "base64");
          } else {
            let formFields = {};
            try {
              formFields = JSON.parse(fileContent);
            } catch (e) {
              formFields = { namaLengkap: child.name.replace("Laporan_", "").replace(".pdf", "") };
            }
            buffer = await generatePdfBuffer(formFields, signature, psyName, sipp);
          }
          archive.append(buffer, { name: nextPath });
        }
      }
    };

    // Process selected top-level items
    for (const id of ids) {
      const node = nodeMap.get(id);
      if (!node) continue;

      if (node.kind === "folder") {
        await addFolderToArchive(node.id, node.name);
      } else {
        const fileContent = node.fileContent || "";
        let buffer: Buffer;

        if (fileContent.startsWith("data:application/pdf;base64,")) {
          const base64Data = fileContent.replace(/^data:application\/pdf;base64,/, "");
          buffer = Buffer.from(base64Data, "base64");
        } else {
          let formFields = {};
          try {
            formFields = JSON.parse(fileContent);
          } catch (e) {
            formFields = { namaLengkap: node.name.replace("Laporan_", "").replace(".pdf", "") };
          }
          buffer = await generatePdfBuffer(formFields, signature, psyName, sipp);
        }
        archive.append(buffer, { name: node.name });
      }
    }

    await archive.finalize();
  } catch (error: any) {
    console.error("[batch-download] Failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
};

// GET /api/reports/counseling - Get only counseling reports (non-PDF upload nodes)
export const getCounselingReports = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      "SELECT id, name, kind, parent_id as \"parentId\", mime_type as \"mimeType\", size, file_content as \"fileContent\", created_at as \"createdAt\" FROM report_nodes WHERE kind = 'file' AND file_content NOT LIKE 'data:application/pdf%'"
    );
    const parsed = result.rows.map(row => {
      let form = {};
      try {
        form = JSON.parse(row.fileContent || "{}");
      } catch (e) {
        form = {};
      }
      return {
        id: row.id,
        name: row.name,
        parentId: row.parentId,
        createdAt: row.createdAt,
        form
      };
    });
    res.json({ ok: true, data: parsed });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

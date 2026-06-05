import { Response } from "express";
import { query, logActivity } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

// GET /api/patients - Get all patients
export const getAllPatients = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query("SELECT * FROM patients ORDER BY registered_at DESC");
    res.json({ ok: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// GET /api/patients/:id - Get patient by ID
export const getPatientById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query("SELECT * FROM patients WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Patient not found" });
      return;
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/patients - Create new patient
export const createPatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const patientData = req.body;

  if (!patientData.name || !patientData.idNumber) {
    res.status(400).json({ ok: false, error: "Missing required fields: name, idNumber" });
    return;
  }

  const id = patientData.id || `pt-${Date.now()}`;
  const registeredAt = patientData.registeredAt || new Date().toISOString().split("T")[0];
  const age = Number(patientData.age) || 0;
  const initials = patientData.initials || patientData.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  try {
    await query(
      `INSERT INTO patients (
        id, name, email, id_number, age, gender, phone, registered_at, initials, batch_id,
        birth_place, education, sibling_order, total_siblings, date_of_birth, occupation,
        country, province, city, full_address, photo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [
        id,
        patientData.name,
        patientData.email || "",
        patientData.idNumber,
        age,
        patientData.gender || "",
        patientData.phone || "",
        registeredAt,
        initials,
        patientData.batchId || null,
        patientData.birthPlace || "",
        patientData.education || "",
        patientData.siblingOrder || "",
        patientData.totalSiblings || "",
        patientData.dateOfBirth || "",
        patientData.occupation || "",
        patientData.country || "",
        patientData.province || "",
        patientData.city || "",
        patientData.fullAddress || "",
        patientData.photo || null,
      ]
    );

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "PATIENT_CREATE",
      `Registered new patient: ${patientData.name} (ID: ${patientData.idNumber})`
    );

    const createdResult = await query("SELECT * FROM patients WHERE id = $1", [id]);
    res.status(201).json({ ok: true, data: createdResult.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/patients/:id - Update patient
export const updatePatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const patientData = req.body;

  try {
    const checkResult = await query("SELECT * FROM patients WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Patient not found" });
      return;
    }

    const currentPatient = checkResult.rows[0];
    const age = patientData.age !== undefined ? Number(patientData.age) : currentPatient.age;
    const initials = patientData.name ? patientData.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : currentPatient.initials;

    await query(
      `UPDATE patients SET
        name = $1, email = $2, id_number = $3, age = $4, gender = $5, phone = $6,
        batch_id = $7, birth_place = $8, education = $9, sibling_order = $10,
        total_siblings = $11, date_of_birth = $12, occupation = $13, country = $14,
        province = $15, city = $16, full_address = $17, photo = $18, initials = $19
      WHERE id = $20`,
      [
        patientData.name || currentPatient.name,
        patientData.email !== undefined ? patientData.email : currentPatient.email,
        patientData.idNumber || currentPatient.id_number,
        age,
        patientData.gender || currentPatient.gender,
        patientData.phone || currentPatient.phone,
        patientData.batchId !== undefined ? patientData.batchId : currentPatient.batch_id,
        patientData.birthPlace !== undefined ? patientData.birthPlace : currentPatient.birth_place,
        patientData.education !== undefined ? patientData.education : currentPatient.education,
        patientData.siblingOrder !== undefined ? patientData.siblingOrder : currentPatient.sibling_order,
        patientData.totalSiblings !== undefined ? patientData.totalSiblings : currentPatient.total_siblings,
        patientData.dateOfBirth !== undefined ? patientData.dateOfBirth : currentPatient.date_of_birth,
        patientData.occupation !== undefined ? patientData.occupation : currentPatient.occupation,
        patientData.country !== undefined ? patientData.country : currentPatient.country,
        patientData.province !== undefined ? patientData.province : currentPatient.province,
        patientData.city !== undefined ? patientData.city : currentPatient.city,
        patientData.fullAddress !== undefined ? patientData.fullAddress : currentPatient.full_address,
        patientData.photo !== undefined ? patientData.photo : currentPatient.photo,
        initials,
        id,
      ]
    );

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "PATIENT_UPDATE",
      `Updated patient profile: ${patientData.name || currentPatient.name} (ID: ${id})`
    );

    const updatedResult = await query("SELECT * FROM patients WHERE id = $1", [id]);
    res.json({ ok: true, data: updatedResult.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE /api/patients/:id - Delete patient (restricted to staff)
export const deletePatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const checkResult = await query("SELECT * FROM patients WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Patient not found" });
      return;
    }

    const patient = checkResult.rows[0];

    await query("DELETE FROM patients WHERE id = $1", [id]);

    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "PATIENT_DELETE",
      `Deleted patient: ${patient.name} (ID: ${patient.id_number})`
    );

    res.json({ ok: true, message: "Patient deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

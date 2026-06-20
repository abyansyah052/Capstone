// api/server.ts
import express from "express";
import cors from "cors";
import dotenv3 from "dotenv";

// backend/src/config/db.ts
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
var connectionString = process.env.DATABASE_URL || `postgresql://${process.env.PGUSER || "postgres"}:${process.env.PGPASSWORD || "postgres"}@${process.env.PGHOST || "localhost"}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || "asisya_db"}`;
var isProduction = process.env.NODE_ENV === "production";
var useSsl = isProduction || connectionString.includes("neon.tech");
var pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5e3,
  // Fail fast (5s) instead of hanging the serverless function
  idleTimeoutMillis: 1e4,
  // Close idle clients fast in serverless environment
  max: 10
  // Limit connections
});
pool.on("error", (err) => {
  console.error("[db] Unexpected error on idle client:", err);
});
var query = (text, params) => {
  return pool.query(text, params);
};
var logActivity = async (userId, email, action, details) => {
  try {
    await pool.query(
      "INSERT INTO activity_logs (user_id, email, action, details) VALUES ($1, $2, $3, $4)",
      [userId || "system", email || "system@asisya.com", action, details]
    );
    console.log(`[log] ${action} - ${email}: ${details}`);
  } catch (error) {
    console.error("[db] Failed to insert activity log:", error);
  }
};

// backend/src/routes/authRoutes.ts
import { Router } from "express";
import bcrypt from "bcryptjs";

// backend/src/middlewares/authMiddleware.ts
var requireAuth = (req, res, next) => {
  const userId = req.headers["x-user-id"] || req.query.userId;
  const userRole = req.headers["x-user-role"] || req.query.role;
  const userEmail = req.headers["x-user-email"] || req.query.email;
  const userName = req.headers["x-user-name"] || req.query.name;
  if (!userId || !userRole || !userEmail) {
    res.status(401).json({
      ok: false,
      error: "Authentication credentials missing in request headers or query parameters"
    });
    return;
  }
  req.user = {
    id: userId,
    role: userRole,
    email: userEmail,
    name: userName || "User"
  };
  next();
};
var requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        ok: false,
        error: `Forbidden: User role '${req.user.role}' is not authorized to access this resource`
      });
      return;
    }
    next();
  };
};

// backend/src/routes/authRoutes.ts
var router = Router();
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ ok: false, error: "Missing name, email, or password" });
    return;
  }
  try {
    const emailCheck = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      res.status(400).json({ ok: false, error: "Email already registered" });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `u-${Date.now()}`;
    await query(
      "INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)",
      [userId, name, email.toLowerCase(), passwordHash, "reguler"]
    );
    await logActivity(userId, email.toLowerCase(), "USER_REGISTER", `User registered with name ${name}`);
    res.status(201).json({
      ok: true,
      data: { id: userId, name, email: email.toLowerCase(), role: "reguler", status: "active" }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ ok: false, error: "Missing email or password" });
    return;
  }
  try {
    const userResult = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (userResult.rows.length === 0) {
      res.status(400).json({ ok: false, error: "Invalid email or password" });
      return;
    }
    const user = userResult.rows[0];
    if (user.status === "banned") {
      res.status(403).json({ ok: false, error: "This account has been banned by Apex Administrator." });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ ok: false, error: "Invalid email or password" });
      return;
    }
    let signature = null;
    if (user.role === "psikolog") {
      const psyResult = await query("SELECT signature FROM psychologists WHERE user_id = $1", [user.id]);
      if (psyResult.rows.length > 0) {
        signature = psyResult.rows[0].signature;
      }
    }
    await logActivity(user.id, user.email, "USER_LOGIN", `Logged in successfully as role: ${user.role}`);
    res.json({
      ok: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        signature
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
router.post("/google", async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    res.status(400).json({ ok: false, error: "Google access token is required" });
    return;
  }
  try {
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    if (!googleRes.ok) {
      res.status(401).json({ ok: false, error: "Google authentication failed: Invalid access token" });
      return;
    }
    const userInfo = await googleRes.json();
    const email = userInfo.email;
    const name = userInfo.name || email;
    if (!email) {
      res.status(400).json({ ok: false, error: "Could not retrieve email address from Google profile" });
      return;
    }
    const userResult = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    let user;
    if (userResult.rows.length === 0) {
      const userId = `u-google-${Date.now()}`;
      const insertResult = await query(
        "INSERT INTO users (id, name, email, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [userId, name, email.toLowerCase(), "reguler", "active"]
      );
      user = insertResult.rows[0];
      await logActivity(userId, email.toLowerCase(), "USER_GOOGLE_REGISTER", `Registered via Secure Google Sign-In`);
    } else {
      user = userResult.rows[0];
      if (user.status === "banned") {
        res.status(403).json({ ok: false, error: "This account has been banned." });
        return;
      }
      await logActivity(user.id, email.toLowerCase(), "USER_GOOGLE_LOGIN", `Logged in via Secure Google Sign-In`);
    }
    let signature = null;
    if (user.role === "psikolog") {
      const psyResult = await query("SELECT signature FROM psychologists WHERE user_id = $1", [user.id]);
      if (psyResult.rows.length > 0) {
        signature = psyResult.rows[0].signature;
      }
    }
    res.json({
      ok: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        signature
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
router.post("/signature", requireAuth, requireRole(["psikolog"]), async (req, res) => {
  const { signature } = req.body;
  const userId = req.user?.id;
  if (!signature) {
    res.status(400).json({ ok: false, error: "Missing signature payload" });
    return;
  }
  try {
    await query("UPDATE psychologists SET signature = $1 WHERE user_id = $2", [signature, userId]);
    await logActivity(userId, req.user?.email, "PSYCHOLOGIST_SIGNATURE_UPDATE", "Updated psychologist digital signature");
    res.json({ ok: true, message: "Signature saved successfully" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
router.get("/users", requireAuth, requireRole(["apex", "staff"]), async (_req, res) => {
  try {
    const result = await query("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC");
    res.json({ ok: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
router.put("/users/:id/role", requireAuth, requireRole(["apex", "staff"]), async (req, res) => {
  const { id } = req.params;
  const { role, sipp, origin, age, phone, address } = req.body;
  if (!role) {
    res.status(400).json({ ok: false, error: "Missing role field" });
    return;
  }
  try {
    const userResult = await query("SELECT * FROM users WHERE id = $1", [id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }
    const user = userResult.rows[0];
    if (req.user?.role === "staff" && (role === "apex" || role === "staff" || user.role === "apex" || user.role === "staff")) {
      res.status(403).json({ ok: false, error: "Forbidden: Staff cannot modify staff or apex roles" });
      return;
    }
    await query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
    if (role === "psikolog") {
      const psyCheck = await query("SELECT * FROM psychologists WHERE user_id = $1", [id]);
      if (psyCheck.rows.length === 0) {
        const psyId = `psy-${Date.now()}`;
        await query(
          "INSERT INTO psychologists (id, user_id, name, email, sipp, origin, age, phone, address, signature) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL)",
          [
            psyId,
            id,
            user.name,
            user.email,
            sipp || "",
            origin || "",
            Number(age) || 0,
            phone || "",
            address || ""
          ]
        );
      } else {
        await query(
          "UPDATE psychologists SET sipp = $1, origin = $2, age = $3, phone = $4, address = $5 WHERE user_id = $6",
          [sipp || "", origin || "", Number(age) || 0, phone || "", address || "", id]
        );
      }
    } else {
      await query("DELETE FROM psychologists WHERE user_id = $1", [id]);
    }
    await logActivity(
      req.user?.id,
      req.user?.email,
      "USER_ROLE_PROMOTION",
      `Updated user ${user.email} role from ${user.role} to ${role}`
    );
    res.json({ ok: true, message: `User role successfully updated to ${role}` });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
router.put("/users/:id/status", requireAuth, requireRole(["apex"]), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !["active", "banned"].includes(status)) {
    res.status(400).json({ ok: false, error: "Invalid status field" });
    return;
  }
  try {
    const userResult = await query("SELECT * FROM users WHERE id = $1", [id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }
    const user = userResult.rows[0];
    if (id === req.user?.id) {
      res.status(400).json({ ok: false, error: "Apex administrator cannot ban their own account." });
      return;
    }
    await query("UPDATE users SET status = $1 WHERE id = $2", [status, id]);
    await logActivity(
      req.user?.id,
      req.user?.email,
      status === "banned" ? "USER_BANNED" : "USER_UNBANNED",
      `Set user account status to ${status} for email: ${user.email}`
    );
    res.json({ ok: true, message: `User status successfully updated to ${status}` });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
router.delete("/users/:id", requireAuth, requireRole(["apex"]), async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await query("SELECT * FROM users WHERE id = $1", [id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }
    const user = userResult.rows[0];
    if (id === req.user?.id) {
      res.status(400).json({ ok: false, error: "Apex administrator cannot delete their own account." });
      return;
    }
    await query("DELETE FROM users WHERE id = $1", [id]);
    await logActivity(
      req.user?.id,
      req.user?.email,
      "USER_DELETED",
      `Deleted user account completely: ${user.email}`
    );
    res.json({ ok: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
router.get("/logs", requireAuth, requireRole(["apex"]), async (_req, res) => {
  try {
    const result = await query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100");
    res.json({ ok: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
var authRoutes_default = router;

// backend/src/routes/patientRoutes.ts
import { Router as Router2 } from "express";

// backend/src/controllers/patientController.ts
var getAllPatients = async (_req, res) => {
  try {
    const result = await query("SELECT * FROM patients ORDER BY registered_at DESC");
    res.json({ ok: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var getPatientById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("SELECT * FROM patients WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Patient not found" });
      return;
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var createPatient = async (req, res) => {
  const patientData = req.body;
  if (!patientData.name || !patientData.idNumber) {
    res.status(400).json({ ok: false, error: "Missing required fields: name, idNumber" });
    return;
  }
  const id = patientData.id || `pt-${Date.now()}`;
  const registeredAt = patientData.registeredAt || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const age = Number(patientData.age) || 0;
  const initials = patientData.initials || patientData.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
        patientData.photo || null
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var updatePatient = async (req, res) => {
  const { id } = req.params;
  const patientData = req.body;
  try {
    const checkResult = await query("SELECT * FROM patients WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Patient not found" });
      return;
    }
    const currentPatient = checkResult.rows[0];
    const age = patientData.age !== void 0 ? Number(patientData.age) : currentPatient.age;
    const initials = patientData.name ? patientData.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : currentPatient.initials;
    await query(
      `UPDATE patients SET
        name = $1, email = $2, id_number = $3, age = $4, gender = $5, phone = $6,
        batch_id = $7, birth_place = $8, education = $9, sibling_order = $10,
        total_siblings = $11, date_of_birth = $12, occupation = $13, country = $14,
        province = $15, city = $16, full_address = $17, photo = $18, initials = $19
      WHERE id = $20`,
      [
        patientData.name || currentPatient.name,
        patientData.email !== void 0 ? patientData.email : currentPatient.email,
        patientData.idNumber || currentPatient.id_number,
        age,
        patientData.gender || currentPatient.gender,
        patientData.phone || currentPatient.phone,
        patientData.batchId !== void 0 ? patientData.batchId : currentPatient.batch_id,
        patientData.birthPlace !== void 0 ? patientData.birthPlace : currentPatient.birth_place,
        patientData.education !== void 0 ? patientData.education : currentPatient.education,
        patientData.siblingOrder !== void 0 ? patientData.siblingOrder : currentPatient.sibling_order,
        patientData.totalSiblings !== void 0 ? patientData.totalSiblings : currentPatient.total_siblings,
        patientData.dateOfBirth !== void 0 ? patientData.dateOfBirth : currentPatient.date_of_birth,
        patientData.occupation !== void 0 ? patientData.occupation : currentPatient.occupation,
        patientData.country !== void 0 ? patientData.country : currentPatient.country,
        patientData.province !== void 0 ? patientData.province : currentPatient.province,
        patientData.city !== void 0 ? patientData.city : currentPatient.city,
        patientData.fullAddress !== void 0 ? patientData.fullAddress : currentPatient.full_address,
        patientData.photo !== void 0 ? patientData.photo : currentPatient.photo,
        initials,
        id
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var deletePatient = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// backend/src/routes/patientRoutes.ts
var router2 = Router2();
router2.use(requireAuth);
router2.get("/", requireRole(["staff", "psikolog", "apex"]), getAllPatients);
router2.get("/:id", requireRole(["staff", "psikolog"]), getPatientById);
router2.post("/", requireRole(["staff", "psikolog"]), createPatient);
router2.put("/:id", requireRole(["staff"]), updatePatient);
router2.delete("/:id", requireRole(["staff"]), deletePatient);
var patientRoutes_default = router2;

// backend/src/routes/psychologistRoutes.ts
import { Router as Router3 } from "express";

// backend/src/controllers/psychologistController.ts
var getAllPsychologists = async (_req, res) => {
  try {
    const result = await query("SELECT * FROM psychologists ORDER BY created_at DESC");
    res.json({ ok: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var getPsychologistById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("SELECT * FROM psychologists WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Psychologist not found" });
      return;
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var createPsychologist = async (req, res) => {
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
        psyData.signature || null
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var updatePsychologist = async (req, res) => {
  const { id } = req.params;
  const psyData = req.body;
  try {
    const checkResult = await query("SELECT * FROM psychologists WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Psychologist not found" });
      return;
    }
    const currentPsy = checkResult.rows[0];
    const age = psyData.age !== void 0 ? Number(psyData.age) : currentPsy.age;
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
        psyData.signature !== void 0 ? psyData.signature : currentPsy.signature,
        id
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var deletePsychologist = async (req, res) => {
  const { id } = req.params;
  try {
    const checkResult = await query("SELECT * FROM psychologists WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: "Psychologist not found" });
      return;
    }
    const psy = checkResult.rows[0];
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// backend/src/routes/psychologistRoutes.ts
var router3 = Router3();
router3.use(requireAuth);
router3.get("/", requireRole(["staff", "apex", "psikolog"]), getAllPsychologists);
router3.get("/:id", requireRole(["staff", "apex"]), getPsychologistById);
router3.post("/", requireRole(["staff", "apex"]), createPsychologist);
router3.put("/:id", requireRole(["staff", "apex"]), updatePsychologist);
router3.delete("/:id", requireRole(["staff", "apex"]), deletePsychologist);
var psychologistRoutes_default = router3;

// backend/src/routes/appointmentRoutes.ts
import { Router as Router4 } from "express";

// backend/src/services/notificationService.ts
import dotenv2 from "dotenv";
dotenv2.config();
var generateCalendarIcs = (summary, dateStr, timeStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  if (!year || !month || !day || hour === void 0 || minute === void 0) {
    return "INVALID_DATE";
  }
  const dtStart = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
  const dtEnd = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T${String(hour + 1).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Asisya Consulting//IPMS//ID",
    "BEGIN:VEVENT",
    `SUMMARY:${summary}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    "DESCRIPTION:Sesi konsultasi psikologi terjadwal di Asisya Consulting",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
};
var sendNotification = async (payload) => {
  const { patientName, date, time, channel, phone, email } = payload;
  const summary = `Janji Temu Konsultasi: ${patientName}`;
  const icsContent = generateCalendarIcs(summary, date, time);
  console.log(`[notification] Triggering notifications for appointment: ${patientName} (${date} at ${time})`);
  if (channel === "whatsapp" || channel === "both") {
    const waUrl = process.env.WHATSAPP_API_URL || "https://api.whatsapp.example/send";
    const waToken = process.env.WHATSAPP_API_TOKEN;
    const msg = `Halo ${patientName}, Anda memiliki jadwal konsultasi psikologi di Asisya Consulting pada ${date} pukul ${time}. Harap hadir tepat waktu. Terima kasih.`;
    console.log(`[whatsapp] Mocking dispatch to ${phone || "no-phone-given"}`);
    console.log(`[whatsapp] Endpoint URL: ${waUrl} (Token Configured: ${!!waToken})`);
    console.log(`[whatsapp] Message content: "${msg}"`);
  }
  if (channel === "email" || channel === "both") {
    const smtpHost = process.env.EMAIL_SMTP_HOST || "smtp.example.com";
    const smtpPort = process.env.EMAIL_SMTP_PORT || "587";
    const smtpUser = process.env.EMAIL_SMTP_USER;
    console.log(`[email] Mocking SMTP calendar dispatch to ${email || "no-email-given"}`);
    console.log(`[email] Configuration: Host=${smtpHost}, Port=${smtpPort}, User=${smtpUser}`);
    console.log(`[email] Attached Calendar .ics Attachment: 
${icsContent}
`);
  }
  return true;
};

// backend/src/controllers/appointmentController.ts
var formatDate = (val) => {
  if (!val) return "";
  if (val instanceof Date) {
    const offset = val.getTimezoneOffset();
    const localDate = new Date(val.getTime() - offset * 60 * 1e3);
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
var getAllAppointments = async (req, res) => {
  const role = req.user?.role;
  try {
    let result;
    if (role === "reguler") {
      result = await query("SELECT * FROM appointments WHERE visible_to_regular = true ORDER BY date DESC, time_slot DESC");
    } else if (role === "psikolog") {
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
      result = await query("SELECT * FROM appointments ORDER BY date DESC, time_slot DESC");
    }
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
      visibleToRegular: !!row.visible_to_regular
    }));
    res.json({ ok: true, data: mapped });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var createAppointment = async (req, res) => {
  const data = req.body;
  const isInternal = data.patientId === "INTERNAL";
  if (!data.patientName || !data.date || !data.time || !isInternal && !data.doctorId) {
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
        visibleToRegular
      ]
    );
    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "APPOINTMENT_SCHEDULE",
      `Scheduled appointment for ${data.patientName} on ${data.date} at ${data.time}. Regular Visible: ${visibleToRegular}`
    );
    if (data.notify && data.notify !== "none") {
      if (isInternal && data.doctorId) {
        const psyIds = data.doctorId.split(",").map((s) => s.trim()).filter(Boolean);
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
              email: psy.email || ""
            });
          }
        }
      } else {
        await sendNotification({
          patientName: data.patientName,
          date: data.date,
          time: data.time,
          channel: data.notify,
          phone: data.notifyPhone,
          email: data.notifyEmail
        });
      }
    }
    res.status(201).json({ ok: true, message: "Appointment scheduled successfully" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var updateAppointment = async (req, res) => {
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
        data.duration !== void 0 ? Number(data.duration) : current.duration,
        data.doctorId || current.psychologist_id,
        data.type || current.type,
        data.status || current.status,
        data.notes !== void 0 ? data.notes : current.notes,
        data.notify || current.notify,
        data.notifyPhone !== void 0 ? data.notifyPhone : current.notify_phone,
        data.notifyEmail !== void 0 ? data.notifyEmail : current.notify_email,
        data.visibleToRegular !== void 0 ? data.visibleToRegular === true || data.visibleToRegular === "true" : current.visible_to_regular,
        id
      ]
    );
    await logActivity(
      req.user?.id || "system",
      req.user?.email || "system@asisya.com",
      "APPOINTMENT_UPDATE",
      `Updated appointment for ${data.patientName || current.patient_name} (ID: ${id})`
    );
    res.json({ ok: true, message: "Appointment updated successfully" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var deleteAppointment = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// backend/src/routes/appointmentRoutes.ts
var router4 = Router4();
router4.use(requireAuth);
router4.get("/", getAllAppointments);
router4.post("/", createAppointment);
router4.put("/:id", updateAppointment);
router4.delete("/:id", deleteAppointment);
var appointmentRoutes_default = router4;

// backend/src/routes/reportRoutes.ts
import { Router as Router5 } from "express";

// backend/src/controllers/reportController.ts
import PDFDocument from "pdfkit";
import archiver from "archiver";
var generatePdfBuffer = async (form, signatureBase64, psyName, sipp) => {
  let batchLogo = null;
  let useLogoInReport = false;
  let logoScale = 1;
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
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));
    if (useLogoInReport && batchLogo && batchLogo.startsWith("data:image")) {
      try {
        const base64Data = batchLogo.replace(/^data:image\/\w+;base64,/, "");
        const logoBuffer = Buffer.from(base64Data, "base64");
        const size = 50 * logoScale;
        const logoX = 545 - size;
        doc.image(logoBuffer, logoX, 45, { width: size, height: size, fit: [size, size] });
      } catch (errImg) {
        console.error("Error drawing batch logo in PDF:", errImg);
      }
    }
    doc.fontSize(14).font("Helvetica-Bold").text("ASISYA PSYCHOLOGICAL CENTER", { align: "center" });
    doc.fontSize(8).font("Helvetica").text("Ruko Grand City Regency A7 - A8 Jl. Rungkut Madya", { align: "center" });
    doc.text("Surabaya - Jawa Timur", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#111827").lineWidth(1.5).stroke();
    doc.moveDown(1);
    doc.fontSize(12).font("Helvetica-Bold").text("FORM KONSELING PSIKOLOGIS", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(10).font("Helvetica-Bold").text("Biodata");
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#6b7280").lineWidth(1).stroke();
    doc.moveDown(0.5);
    const leftColX = 50;
    const rightColX = 200;
    const drawRow = (label, val) => {
      const currentY = doc.y;
      doc.fontSize(9).font("Helvetica-Bold").text(label, leftColX, currentY, { width: 140 });
      doc.font("Helvetica").text(val || "\u2014", rightColX, currentY);
      doc.moveDown(0.3);
    };
    drawRow("Nama Lengkap:", form.namaLengkap);
    drawRow("Tempat/Tanggal Lahir:", `${form.tempatLahir || "\u2014"}${form.tempatLahir && form.tanggalLahir ? " / " : ""}${form.tanggalLahir || ""}`);
    drawRow("Jenis Kelamin:", form.jenisKelamin);
    drawRow("Usia:", form.usia ? `${form.usia} Tahun` : "\u2014");
    drawRow("Pendidikan Terakhir:", form.pendidikan);
    drawRow("Anak Keberapa:", form.anakKeberapa || form.jumlahSaudara ? `Anak ke ${form.anakKeberapa || "\u2014"} dari ${form.jumlahSaudara || "\u2014"} bersaudara` : "\u2014");
    drawRow("Alamat:", form.alamat);
    doc.moveDown(0.5);
    const drawSection = (title, text) => {
      doc.fontSize(10).font("Helvetica-Bold").text(title, leftColX);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#6b7280").lineWidth(1).stroke();
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica").text(text || "\u2014", { align: "justify", lineGap: 3 });
      doc.moveDown(1);
    };
    drawSection("Permasalahan Saat Ini", form.permasalahan);
    drawSection("Proses Konseling", form.prosesKonseling);
    drawSection("Diagnosis Klinis", form.diagnosisKlinis);
    drawSection("Saran Pengembangan dan Intervensi", form.saranPengembangan);
    doc.moveDown(1);
    const rightAlignX = 350;
    const today = (/* @__PURE__ */ new Date()).toLocaleDateString("id-ID", {
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
var getAllReportNodes = async (_req, res) => {
  try {
    const result = await query('SELECT id, name, kind, parent_id as "parentId", mime_type as "mimeType", size, created_at as "createdAt" FROM report_nodes ORDER BY created_at DESC');
    res.json({ ok: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var createReportNode = async (req, res) => {
  const { id, name, kind, parentId, mimeType, size, fileContent, createdAt } = req.body;
  if (!id || !name || !kind) {
    res.status(400).json({ ok: false, error: "Missing required node attributes: id, name, kind" });
    return;
  }
  const createdDate = createdAt || (/* @__PURE__ */ new Date()).toLocaleDateString("id-ID");
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
    const created = await query('SELECT id, name, kind, parent_id as "parentId", mime_type as "mimeType", size, created_at as "createdAt" FROM report_nodes WHERE id = $1', [id]);
    res.status(201).json({ ok: true, data: created.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var updateReportNode = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var deleteReportNode = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var deleteReportNodesBulk = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var previewOrDownloadPdf = async (req, res) => {
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
    if (fileContent.startsWith("data:application/pdf;base64,")) {
      const base64Data = fileContent.replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      res.send(buffer);
      return;
    }
    let formFields = {};
    try {
      formFields = JSON.parse(fileContent);
    } catch (e) {
      formFields = { namaLengkap: node.name.replace("Laporan_", "").replace(".pdf", "") };
    }
    let signature = null;
    let psyName = "Dairy Team";
    let sipp = "SIPP/09/2026/01-DT";
    if (req.user?.role === "psikolog") {
      const psyResult = await query("SELECT * FROM psychologists WHERE user_id = $1", [req.user.id]);
      if (psyResult.rows.length > 0) {
        const p = psyResult.rows[0];
        signature = p.signature;
        psyName = p.name;
        sipp = p.sipp || "";
      }
    } else {
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var batchDownloadReports = async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ ok: false, error: "Missing array of ids to batch download" });
    return;
  }
  try {
    const dbNodesResult = await query('SELECT id, name, kind, parent_id as "parentId", file_content as "fileContent" FROM report_nodes');
    const dbNodes = dbNodesResult.rows;
    const nodeMap = /* @__PURE__ */ new Map();
    dbNodes.forEach((n) => nodeMap.set(n.id, n));
    const archive = archiver("zip", { zlib: { level: 9 } });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="counseling_reports_batch.zip"');
    archive.on("error", (err) => {
      throw err;
    });
    archive.pipe(res);
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
    const addFolderToArchive = async (folderId, currentZipPath) => {
      const children = dbNodes.filter((n) => n.parentId === folderId);
      for (const child of children) {
        const nextPath = `${currentZipPath}/${child.name}`;
        if (child.kind === "folder") {
          await addFolderToArchive(child.id, nextPath);
        } else {
          const fileContent = child.fileContent || "";
          let buffer;
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
    for (const id of ids) {
      const node = nodeMap.get(id);
      if (!node) continue;
      if (node.kind === "folder") {
        await addFolderToArchive(node.id, node.name);
      } else {
        const fileContent = node.fileContent || "";
        let buffer;
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
  } catch (error) {
    console.error("[batch-download] Failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
};
var getCounselingReports = async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, name, kind, parent_id as "parentId", mime_type as "mimeType", size, file_content as "fileContent", created_at as "createdAt" FROM report_nodes WHERE kind = 'file' AND file_content NOT LIKE 'data:application/pdf%'`
    );
    const parsed = result.rows.map((row) => {
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// backend/src/routes/reportRoutes.ts
var router5 = Router5();
router5.use(requireAuth);
router5.get("/", requireRole(["psikolog", "staff", "apex"]), getAllReportNodes);
router5.get("/counseling", requireRole(["psikolog", "staff", "apex"]), getCounselingReports);
router5.post("/", requireRole(["psikolog"]), createReportNode);
router5.put("/:id", requireRole(["psikolog"]), updateReportNode);
router5.post("/bulk-delete", requireRole(["psikolog"]), deleteReportNodesBulk);
router5.delete("/:id", requireRole(["psikolog"]), deleteReportNode);
router5.get("/:id/pdf", requireRole(["psikolog", "staff", "apex"]), previewOrDownloadPdf);
router5.post("/batch-download", requireRole(["psikolog", "staff", "apex"]), batchDownloadReports);
var reportRoutes_default = router5;

// backend/src/routes/batchRoutes.ts
import { Router as Router6 } from "express";

// backend/src/controllers/batchController.ts
var getAllBatches = async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, name, company, color, deleted, logo, use_logo_in_report as "useLogoInReport", logo_scale as "logoScale" 
       FROM batches 
       ORDER BY id ASC`
    );
    res.json({ ok: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var createBatch = async (req, res) => {
  const { id, name, company, color, logo, useLogoInReport, logoScale } = req.body;
  if (!id || !name || !company || !color) {
    res.status(400).json({ ok: false, error: "Missing required fields: id, name, company, color" });
    return;
  }
  try {
    const check = await query("SELECT * FROM batches WHERE id = $1", [id]);
    if (check.rows.length > 0) {
      const existing = check.rows[0];
      if (existing.deleted) {
        await query(
          `UPDATE batches 
           SET name = $1, company = $2, color = $3, logo = $4, use_logo_in_report = $5, logo_scale = $6, deleted = false 
           WHERE id = $7`,
          [name, company, color, logo || null, !!useLogoInReport, logoScale !== void 0 ? logoScale : 1, id]
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
            logoScale: logoScale !== void 0 ? logoScale : 1
          }
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
      [id, name, company, color, logo || null, !!useLogoInReport, logoScale !== void 0 ? logoScale : 1]
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
        logoScale: logoScale !== void 0 ? logoScale : 1
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var updateBatch = async (req, res) => {
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
      [name, company, color, logo !== void 0 ? logo : null, !!useLogoInReport, logoScale !== void 0 ? logoScale : 1, id]
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
        logo: logo !== void 0 ? logo : null,
        useLogoInReport: !!useLogoInReport,
        logoScale: logoScale !== void 0 ? logoScale : 1
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
var deleteBatch = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// backend/src/routes/batchRoutes.ts
var router6 = Router6();
router6.use(requireAuth);
router6.get("/", getAllBatches);
router6.post("/", requireRole(["staff"]), createBatch);
router6.put("/:id", requireRole(["staff"]), updateBatch);
router6.delete("/:id", requireRole(["staff"]), deleteBatch);
var batchRoutes_default = router6;

// backend/src/routes/dashboardRoutes.ts
import { Router as Router7 } from "express";
var router7 = Router7();
router7.get("/stats", requireAuth, async (_req, res) => {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const patientsCountResult = await query("SELECT COUNT(*) FROM patients");
    const todayAppointmentsResult = await query("SELECT COUNT(*) FROM appointments WHERE date = $1 AND status != 'cancelled'", [today]);
    const internalAppointmentsResult = await query("SELECT COUNT(*) FROM appointments WHERE visible_to_regular = false AND status != 'cancelled'");
    res.json({
      ok: true,
      data: {
        totalPatients: parseInt(patientsCountResult.rows[0].count) || 0,
        todayAppointments: parseInt(todayAppointmentsResult.rows[0].count) || 0,
        internalAppointments: parseInt(internalAppointmentsResult.rows[0].count) || 0
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
var dashboardRoutes_default = router7;

// backend/src/middlewares/errorMiddleware.ts
var errorHandler = (err, _req, res, _next) => {
  console.error(`[error] Error occurred: ${err.message}`);
  res.status(500).json({
    ok: false,
    error: err.message || "Internal Server Error"
  });
};

// api/server.ts
dotenv3.config();
var app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Asisya IHMS Backend API is running on Vercel Serverless",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var dbInitialized = false;
app.use(async (_req, _res, next) => {
  if (!dbInitialized) {
    if (!process.env.DATABASE_URL) {
      console.warn("[serverless] WARNING: DATABASE_URL environment variable is not set!");
      dbInitialized = true;
      return next();
    }
    try {
      console.log("[serverless] Verifying database connection...");
      await pool.query("SELECT 1");
      dbInitialized = true;
      console.log("[serverless] Database connection verified successfully.");
    } catch (err) {
      console.error("[serverless] Database connection verification failed:", err);
    }
  }
  next();
});
app.use("/api/auth", authRoutes_default);
app.use("/api/patients", patientRoutes_default);
app.use("/api/psychologists", psychologistRoutes_default);
app.use("/api/appointments", appointmentRoutes_default);
app.use("/api/reports", reportRoutes_default);
app.use("/api/batches", batchRoutes_default);
app.use("/api/dashboard", dashboardRoutes_default);
app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: "Serverless route not found"
  });
});
app.use(errorHandler);
var server_default = app;
export {
  server_default as default
};

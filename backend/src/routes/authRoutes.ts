import { Router, Response } from "express";
import * as bcryptModule from "bcryptjs";
const bcrypt = (bcryptModule.default || bcryptModule) as any;
import { query, logActivity } from "../config/db";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middlewares/authMiddleware";

const router = Router();

// Endpoint: Register new user
router.post("/register", async (req: AuthenticatedRequest, res: Response) => {
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
      data: { id: userId, name, email: email.toLowerCase(), role: "reguler", status: "active" },
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint: Login
router.post("/login", async (req: AuthenticatedRequest, res: Response) => {
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

    // Retrieve signature if role is psychologist
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
        signature,
      },
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint: Secure Google Auth Login / Register
router.post("/google", async (req: AuthenticatedRequest, res: Response) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    res.status(400).json({ ok: false, error: "Google access token is required" });
    return;
  }

  try {
    // Call Google's Userinfo API directly to verify the token and get user profile
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    if (!googleRes.ok) {
      res.status(401).json({ ok: false, error: "Google authentication failed: Invalid access token" });
      return;
    }

    const userInfo: any = await googleRes.json();
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
        signature,
      },
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint: Save Psychologist Signature (Psikolog only)
router.post("/signature", requireAuth, requireRole(["psikolog"]), async (req: AuthenticatedRequest, res: Response) => {
  const { signature } = req.body;
  const userId = req.user?.id;

  if (!signature) {
    res.status(400).json({ ok: false, error: "Missing signature payload" });
    return;
  }

  try {
    await query("UPDATE psychologists SET signature = $1 WHERE user_id = $2", [signature, userId]);
    await logActivity(userId!, req.user?.email!, "PSYCHOLOGIST_SIGNATURE_UPDATE", "Updated psychologist digital signature");
    res.json({ ok: true, message: "Signature saved successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint: Get all users (Restricted to apex and staff)
router.get("/users", requireAuth, requireRole(["apex", "staff"]), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC");
    res.json({ ok: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint: Update user role (Restricted to apex and staff)
router.put("/users/:id/role", requireAuth, requireRole(["apex", "staff"]), async (req: AuthenticatedRequest, res: Response) => {
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

    // Restrict staff from promoting/demoting apex or other staff roles
    if (req.user?.role === "staff" && (role === "apex" || role === "staff" || user.role === "apex" || user.role === "staff")) {
      res.status(403).json({ ok: false, error: "Forbidden: Staff cannot modify staff or apex roles" });
      return;
    }

    await query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);

    // Handle psychologist-specific promotion data integration
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
            address || "",
          ]
        );
      } else {
        await query(
          "UPDATE psychologists SET sipp = $1, origin = $2, age = $3, phone = $4, address = $5 WHERE user_id = $6",
          [sipp || "", origin || "", Number(age) || 0, phone || "", address || "", id]
        );
      }
    } else {
      // If demoted from psychologist, clear/remove signature profile references
      await query("DELETE FROM psychologists WHERE user_id = $1", [id]);
    }

    await logActivity(
      req.user?.id!,
      req.user?.email!,
      "USER_ROLE_PROMOTION",
      `Updated user ${user.email} role from ${user.role} to ${role}`
    );

    res.json({ ok: true, message: `User role successfully updated to ${role}` });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint: Update user status [Ban / Unban] (Apex only)
router.put("/users/:id/status", requireAuth, requireRole(["apex"]), async (req: AuthenticatedRequest, res: Response) => {
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

    // Apex cannot ban themselves
    if (id === req.user?.id) {
      res.status(400).json({ ok: false, error: "Apex administrator cannot ban their own account." });
      return;
    }

    await query("UPDATE users SET status = $1 WHERE id = $2", [status, id]);
    await logActivity(
      req.user?.id!,
      req.user?.email!,
      status === "banned" ? "USER_BANNED" : "USER_UNBANNED",
      `Set user account status to ${status} for email: ${user.email}`
    );

    res.json({ ok: true, message: `User status successfully updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint: Delete User (Apex only)
router.delete("/users/:id", requireAuth, requireRole(["apex"]), async (req: AuthenticatedRequest, res: Response) => {
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
      req.user?.id!,
      req.user?.email!,
      "USER_DELETED",
      `Deleted user account completely: ${user.email}`
    );

    res.json({ ok: true, message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint: Get Activity Logs (Apex only)
router.get("/logs", requireAuth, requireRole(["apex"]), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100");
    res.json({ ok: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;

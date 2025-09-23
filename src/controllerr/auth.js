import pool from "../db/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//helpers
import {
  checkEmailValid,
  checkPasswordValid,
  checkPinValid,
} from "../helper/helper.js";
import { sendTokenEmail } from "../helper/sendTokenEmail.js";

export const registerUser = async (req, res) => {
  const { fullName, email, password, pin, role_name } = req.body;
  const SALTNUMBER = parseInt(process.env.GEN_SALT, 10) || 10;

  if (!fullName || !email || !password || !pin) {
    return res
      .status(400)
      .json({ error: "All fields are required", status: "invalid" });
  }

  if (!checkEmailValid(email)) {
    return res
      .status(400)
      .json({ error: "Invalid email format", status: "invalid" });
  }
  if (!checkPasswordValid(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      status: "invalid",
    });
  }

  if (!checkPinValid(pin)) {
    return res
      .status(400)
      .json({ error: "Invalid PIN format", status: "invalid" });
  }

  if (!role_name) {
    return res
      .status(400)
      .json({ error: "Role name is required", status: "error" });
  }

  try {
    // Check if email already exists
    const [existing] = await pool.query(
      "SELECT email FROM register_users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Email already exists", status: "error" });
    }

    // Hash password and pin
    const salt = bcrypt.genSaltSync(SALTNUMBER);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const pin_hash = bcrypt.hashSync(pin, salt);
    const values = [fullName, email, hashedPassword, pin_hash];

    // Get role_id for requested role
    const [roleRows] = await pool.query(
      "SELECT role_id FROM roles WHERE role_name = ?",
      [role_name]
    );
    if (!roleRows || roleRows.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid role name", status: "error" });
    }
    const role_id = roleRows[0].role_id;

    // Get role_id for ADMIN assignment (first user_roles row)
    const [userRoleRows] = await pool.query(
      "SELECT * FROM user_roles WHERE role_id = ?",
      [role_id]
    );

    const role_id_assign = userRoleRows[0]?.role_id;

    if (role_id_assign) {
      return res.status(400).json({
        error: "ADMIN role already assigned, you can't create it again",
        status: "error",
      });
    }

    if (role_name === "ADMIN") {
      const [result] = await pool.query(
        "INSERT INTO register_users (username, email, master_password, pin_hash) VALUES (?, ?, ?, ?)",
        values
      );
      const assignRole =
        "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)";
      await pool.query(assignRole, [result.insertId, role_id]);
      return res.status(201).json({
        message: "User registered successfully",
        userId: result.insertId,
        status: "success",
      });
    } else {
      return res
        .status(403)
        .json({ error: "Unauthorized role assignment only one ADMIN" });
    }
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const JWTSECRET = process.env.JWT_SECRET || "secret";

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required", status: "invalid" });
  }

  try {
    // Check if user exists
    const [userRows] = await pool.query(
      `SELECT 
      u.user_id,
      u.username,
      u.email,
      u.master_password,   -- ✅ add this!
      r.role_name
   FROM register_users u
   JOIN user_roles ur ON u.user_id = ur.user_id
   JOIN roles r ON ur.role_id = r.role_id
   WHERE u.email = ?`,
      [email]
    );

    if (userRows.length === 0) {
      return res
        .status(401)
        .json({ error: "Invalid email or password", status: "invalid" });
    }

    const user = userRows[0];
    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.master_password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: "Invalid email or password", status: "invalid" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id }, `${JWTSECRET}`, {
      expiresIn: "1h",
    });

    // Set token in cookie (optional)
    res.cookie("access_token", token, { httpOnly: true, secure: true });

    return res.status(200).json({
      message: "Login successful",
      token,
      data: user,
      status: "success",
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", status: "error" });
  }
};

export const logOutUser = (req, res) => {
  // Clear the access token cookie
  res.clearCookie("access_token", {
    secure: true,
    sameSite: "none",
  });
  return res
    .status(200)
    .json({ message: "Logout successful", status: "success" });
};

export const forgotAdminPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const JWTSECRET = process.env.JWT_SECRET || "secret";

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // 1. Check if ADMIN exists
    const [userRows] = await pool.query(
      "SELECT u.user_id, u.username, u.email FROM register_users u JOIN user_roles ur ON u.user_id = ur.user_id JOIN roles r ON ur.role_id = r.role_id WHERE u.email = ? AND r.role_name = 'ADMIN'",
      [email]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: "ADMIN user not found" });
    }

    const adminUser = userRows[0];

    // 2. Generate a short-lived JWT token (valid 15 min)
    const resetToken = jwt.sign({ userId: adminUser.user_id }, JWTSECRET, {
      expiresIn: "15m",
    });

    // 3. Create reset link
    const resetLink = `${process.env.URL}/admin-reset-password/${resetToken}`;
    const emailParameters = {
      email: adminUser.email,
      username: adminUser.username,
      resetLink,
      subject: "Set Your Master Password and PIN",
      descrip:
        "Please click the link below to set your master password and PIN:",
      hour: 0.15,
    };
    const emailSent = await sendTokenEmail(emailParameters);
    if (!emailSent) {
      res.status(500).json({ error: "Failed to send email" });
    }

    return res.json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error("Error in forgotAdminPassword:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const pinServiceStatus = async (req, res) => {
  const { email, pin } = req.body;

  try {
    // Validate request body
    if (!email || !pin) {
      return res.status(400).json({
        status: "error",
        error: "Email and PIN are required",
      });
    }

    // Look up user by email
    const [rows] = await pool.query(
      "SELECT user_id, pin_hash FROM register_users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        error: "User not found",
      });
    }

    const user = rows[0];

    // Validate PIN against hash
    const isPinValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isPinValid) {
      return res.status(401).json({
        status: "invalid",
        error: "Invalid PIN",
      });
    }

    // Success response
    return res.status(200).json({
      status: "success",
      message: "PIN service status retrieved successfully",
    });
  } catch (err) {
    console.error("Error checking PIN service status:", err);
    return res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

import pool from "../db/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
//helpers
import {
  checkEmailValid,
  checkPasswordValid,
  checkPinValid,
} from "../helper/helper.js";

export const registerUser = async (req, res) => {
  const { fullName, email, password, pin, role_name } = req.body;

  if (!fullName || !email || !password || !pin) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!checkEmailValid(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  if (!checkPasswordValid(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    });
  }

  if (!checkPinValid(pin)) {
    return res.status(400).json({ error: "Invalid PIN format" });
  }

  if (!role_name) {
    return res.status(400).json({ error: "Role name is required" });
  }

  try {
    // Check if email already exists
    const [existing] = await pool.query(
      "SELECT email FROM register_users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password and pin
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const pin_hash = bcrypt.hashSync(pin, salt);
    const values = [fullName, email, hashedPassword, pin_hash];

    // Get role_id for requested role
    const [roleRows] = await pool.query(
      "SELECT role_id FROM roles WHERE role_name = ?",
      [role_name]
    );
    if (!roleRows || roleRows.length === 0) {
      return res.status(400).json({ error: "Invalid role name" });
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
      });
    } else {
      return res
        .status(403)
        .json({ error: "Unauthorized role assignment only ADMIN" });
    }
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check if user exists
    const [userRows] = await pool.query(
      "SELECT * FROM register_users WHERE email = ?",
      [email]
    );
    if (userRows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = userRows[0];
    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.master_password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id }, "secret", {
      expiresIn: "1h",
    });

    // Set token in cookie (optional)
    res.cookie("access_token", token, { httpOnly: true, secure: true });

    const { master_password, pin_hash, ...others } = user;

    console.log("user", others);

    return res.status(200).json({
      message: "Login successful",
      token,
      data: others,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const logOutUser = (req, res) => {
  // Clear the access token cookie
  res.clearCookie("access_token", {
    secure: true,
    sameSite: "none",
  });
  return res.status(200).json({ message: "Logout successful" });
};

import pool from "../db/database.js";
//helpers
import {
  checkEmailValid,
  checkPasswordValid,
  checkPinValid,
} from "../helper/helper.js";

export const registerUser = async (req, res) => {
  const { fullName, email, password, pin } = req.body;

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

  try {
    const query = "SELECT email FROM users WHERE email = ?";
    pool.query(query, [email], async (err, results) => {
      if (err) {
        console.error("Error checking email:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }
    });
    //hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const values = [fullName, email, hashedPassword, pin];
    const result = await pool.query(
      "INSERT INTO users (full_name, email, password, pin) VALUES (?, ?, ?, ?)",
      values
    );
    return res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

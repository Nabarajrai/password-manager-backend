import pool from "../db/database.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import { sendTokenEmail } from "../helper/sendTokenEmail.js";
export const getAllUsers = async (req, res) => {
  try {
    const [allUsers] = await pool.query(`
      SELECT 
          ru.user_id AS id,
          ru.username,
          ru.email,
          ru.created_at,
          ru.updated_at,
          ru.last_password_change,
          r.role_id,
          r.role_name,
          'registered' AS type
      FROM register_users ru
      LEFT JOIN user_roles ur ON ru.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      ORDER BY created_at DESC
    `);

    return res.status(200).json({ users: allUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllTempUsers = async (req, res) => {
  try {
    const [tempUsers] = await pool.query(` SELECT
          tu.temp_id AS id,
          tu.username,
          tu.email,
          tu.created_at,
          NULL AS updated_at,
          r.role_id,
          r.role_name,
          'temporary' AS type
      FROM temporary_users tu
      LEFT JOIN roles r ON tu.role_id = r.role_id`);
    return res.status(200).json({ users: tempUsers });
  } catch (error) {
    console.error("Error fetching temporary users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// export const getUserById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const [rows] = await pool.query(
//       "SELECT * FROM register_users WHERE user_id = ?",
//       [id]
//     );
//     if (rows.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     res.status(200).json(rows[0]);
//   } catch (error) {
//     console.error("Error fetching user:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const deleteUser = async (req, res) => {
  const { id } = req.query;
  try {
    // 1. Check if user exists
    const [userRows] = await pool.query(
      "SELECT u.user_id, r.role_name FROM register_users u JOIN user_roles ur ON u.user_id = ur.user_id JOIN roles r ON ur.role_id = r.role_id WHERE u.user_id = ?",
      [id]
    );

    if (!userRows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRows[0];

    // 2. Prevent ADMIN from deleting themselves
    if (user.role_name === "ADMIN") {
      return res
        .status(403)
        .json({ error: "ADMIN cannot delete their own account" });
    }

    // 3. Delete user
    const [result] = await pool.query(
      "DELETE FROM register_users WHERE user_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createTempUser = async (req, res) => {
  const { username, email, temp_password, pin_hash, role_id } = req.body;

  if (!username || !email || !temp_password || !pin_hash || !role_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if email already exists in permanent or temporary users
    const [existingUser] = await pool.query(
      "SELECT * FROM register_users WHERE email = ?",
      [email]
    );
    const [existingTemp] = await pool.query(
      "SELECT * FROM temporary_users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0 || existingTemp.length > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert temporary user
    const query = `
            INSERT INTO temporary_users 
                (username, email, temp_password, pin_hash, token, token_expires_at,role_id)
            VALUES (?, ?, ?, ?, ?, ?,?)
        `;
    const values = [
      username,
      email,
      temp_password,
      pin_hash,
      token,
      tokenExpiresAt,
      role_id,
    ];
    const [result] = await pool.query(query, values);

    // Send token link
    const link = `${process.env.URL}/set-password?token=${token}`;
    const emailParameters = {
      email,
      username,
      link,
      subject: "Set Your Master Password and PIN",
      descrip:
        "You have been created as a new user. Please click the link below to set your master password and PIN:",
      hour: 24,
    };
    const emailSent = await sendTokenEmail(emailParameters);

    if (!emailSent) {
      const query = "DELETE FROM temporary_users WHERE temp_id = ?";
      await pool.query(query, [result.insertId]);
      return res
        .status(500)
        .json({ error: "Failed to send email. Try again later." });
    }
    return res.status(201).json({
      message:
        "Temporary user created successfully. Check email to set password and PIN.",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating temporary user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePasswordAndPin = async (req, res) => {
  const { token, new_password, new_pin } = req.body;
  const saltRounds = parseInt(process.env.GEN_SALT, 10) || 10;

  if (!token || !new_password || !new_pin) {
    return res
      .status(400)
      .json({ error: "Token, password, and PIN are required" });
  }

  try {
    //validation token
    const [rows] = await pool.query(
      "SELECT * FROM temporary_users WHERE token = ? AND token_expires_at > NOW()",
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const tempUser = rows[0];
    const hashedPassword = bcrypt.hashSync(new_password, saltRounds);

    const hashPin = bcrypt.hashSync(new_pin, saltRounds);
    const [result] = await pool.query(
      `INSERT INTO register_users (username, email, master_password, pin_hash) 
       VALUES (?, ?, ?, ?)`,
      [tempUser.username, tempUser.email, hashedPassword, hashPin]
    );
    if (result.affectedRows === 0) {
      return res.status(500).json({ error: "Failed to register user" });
    }
    const [resultOfuserroles] = await pool.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
      [result.insertId, tempUser.role_id]
    );

    if (resultOfuserroles.affectedRows === 0) {
      await pool.query("DELETE FROM register_users WHERE user_id = ?", [
        result.insertId,
      ]);
      return res.status(500).json({ error: "Failed to assign user role" });
    }
    if (result.affectedRows === 0 && resultOfuserroles.affectedRows === 0) {
      return res
        .status(500)
        .json({ error: "Failed to register user and assign role" });
    } else {
      const [resultOfTempUser] = await pool.query(
        "DELETE FROM temporary_users WHERE temp_id = ?",
        [tempUser.temp_id]
      );
      if (resultOfTempUser.affectedRows === 0) {
        await pool.query("DELETE FROM register_users WHERE user_id = ?", [
          result.insertId,
        ]);
        return res
          .status(500)
          .json({ error: "Failed to delete temporary user" });
      }
      return res.status(200).json({
        message: "Password and PIN updated successfully. Account activated!",
        userId: result.insertId,
        status: "success",
      });
    }
  } catch (error) {
    console.error("Error updating password and PIN:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  const saltRounds = parseInt(process.env.GEN_SALT, 10) || 10;

  if (!token || !new_password) {
    return res
      .status(400)
      .json({ error: "Token and new password are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM password_resets WHERE token =? AND expires_at > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired toekn" });
    }

    const resetPassUser = rows[0];
    // Check if user exists
    const [user] = await pool.query(
      "SELECT * FROM register_users WHERE email = ?",
      [resetPassUser.email]
    );
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(new_password, saltRounds);

    // Update password
    const [result] = await pool.query(
      "UPDATE register_users SET master_password = ? WHERE email = ?",
      [hashedPassword, resetPassUser.email]
    );
    if (result.affectedRows === 1) {
      await pool.query("DELETE FROM password_resets WHERE resetPass_id =? ", [
        resetPassUser.resetPass_id,
      ]);
    }
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPin = async (req, res) => {
  const { token, new_pin } = req.body;
  const saltRounds = parseInt(process.env.GEN_SALT, 10) || 10;

  if (!token || !new_pin) {
    return res.status(400).json({ error: "Token and new PIN are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM pin_reset WHERE token = ? AND expires_at > NOW()",
      [token]
    );

    if (rows.length === 0) {
      res.status(400).json({ error: "Invalid or expired Token" });
    }
    const resetPinUser = rows[0];
    // Check if user exists
    const [user] = await pool.query(
      "SELECT * FROM register_users WHERE email = ?",
      [resetPinUser.email]
    );
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new PIN
    const hashPin = bcrypt.hashSync(new_pin, saltRounds);

    // Update PIN
    const [result] = await pool.query(
      "UPDATE register_users SET pin_hash = ? WHERE email = ?",
      [hashPin, resetPinUser.email]
    );
    if (result.affectedRows === 1) {
      await pool.query("DELETE FROM pin_reset WHERE resetPin_id = ?", [
        resetPinUser.resetPin_id,
      ]);
    }
    return res.status(200).json({ message: "PIN reset successfully" });
  } catch (error) {
    console.error("Error resetting PIN:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sentResetPasswordLink = async (req, res) => {
  const { username, email } = req.body;

  if (!email || !username) {
    return res.status(400).json({ error: "Email and username are required" });
  }

  try {
    // Check if user exists
    const [user] = await pool.query(
      "SELECT * FROM register_users WHERE email = ?",
      [email]
    );
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    const [result] = await pool.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)",
      [email, token, expiresAt]
    );

    // Send email with reset link
    if (result.affectedRows === 1) {
      const resetLink = `${process.env.URL}/reset-password?token=${token}`;
      const emailOptions = {
        email,
        username,
        link: resetLink,
        subject: "Password Reset",
        descrip: "Click here to reset your password",
        hour: 1,
      };
      const sentEmail = await sendTokenEmail(emailOptions);
      console.log("sentEmail", result);

      if (!sentEmail) {
        await pool.query("DELETE FROM password_resets WHERE resetPass_id = ?", [
          result.insertId,
        ]);
        return res
          .status(400)
          .json({ error: "Failed to send email. Try again later" });
      } else {
        return res
          .status(200)
          .json({ message: "Reset link sent successfully" });
      }
    } else {
      return res.status(500).json({ error: "Failed to create reset token" });
    }
  } catch (error) {
    console.error("Error sending reset link:", error);
    return res
      .status(500)
      .json({ error: "User in password reset process mode" });
  }
};

export const sentResetPinLink = async (req, res) => {
  const { email, username } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is Required" });
  }
  try {
    const [user] = await pool.query(
      "SELECT * FROM register_users WHERE email = ?",
      [email]
    );
    if (user.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000);
    const [result] = await pool.query(
      "INSERT INTO pin_reset (email, token, expires_at) VALUES (?, ?, ?)",
      [email, token, expiresAt]
    );

    //send link with reset link
    if (result.affectedRows === 1) {
      const resetLink = `${process.env.URL}/reset-pin?token=${token}`;
      const emailOptions = {
        email,
        username,
        link: resetLink,
        subject: "Pin Reset",
        descrip: "Click here to reset your Pin",
        hour: 1,
      };
      const sentEmail = await sendTokenEmail(emailOptions);
      if (!sentEmail) {
        await pool.query("DELETE FROM pin_reset WHERE resetPin_id = ?", [
          result.insertId,
        ]);
        return res
          .status(400)
          .json({ error: "Failed to send email. Try again later" });
      } else {
        return res
          .status(200)
          .json({ message: "Reset link sent successfully" });
      }
    } else {
      return res.status(400).json({ error: "Failed to create reset token" });
    }
  } catch (e) {
    console.error("Error sending reset link", e);
    return res.status(400).json({ error: "User in pin reset process mode" });
  }
};

export const deleteTempUser = async (req, res) => {
  const { id } = req.query;
  try {
    // 1. Check if user exists
    const [userRows] = await pool.query(
      "SELECT * FROM temporary_users WHERE temp_id = ?",
      [id]
    );
    if (!userRows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Delete user
    await pool.query("DELETE FROM temporary_users WHERE temp_id = ?", [id]);
    return res
      .status(200)
      .json({ message: " Temporary  deleted successfully", status: "success" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserCounts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.role_name AS title, COUNT(*) AS number
      FROM register_users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      JOIN roles r ON ur.role_id = r.role_id
      GROUP BY r.role_name;
    `);

    // calculate total from role counts
    const total = rows.reduce((sum, role) => sum + role.number, 0);

    // put total at the beginning
    const result = [{ title: "total", number: total }, ...rows];

    res.json(result);
  } catch (err) {
    console.error("Error fetching counts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required" });
  }
  try {
    // Check if user exists
    const [userRows] = await pool.query(
      "SELECT * FROM register_users WHERE user_id = ?",
      [id]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    // Check if email is already in use by another user
    const [emailRows] = await pool.query(
      "SELECT * FROM register_users WHERE email = ? AND user_id != ?",
      [email, id]
    );
    if (emailRows.length > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Update user details
    const [result] = await pool.query(
      "UPDATE register_users SET username = ?, email = ?, updated_at = NOW() WHERE user_id = ?",
      [username, email, id]
    );
    if (result.affectedRows === 0) {
      return res.status(500).json({ error: "Failed to update user" });
    }
    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserById = async (req, res) => {
  const { email } = req.query;
  try {
    const [userRows] = await pool.query(
      `SELECT 
      u.user_id,
      u.username,
      u.email,
      u.master_password,   
      r.role_name
        FROM register_users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        WHERE u.email = ?`,
      [email]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(userRows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

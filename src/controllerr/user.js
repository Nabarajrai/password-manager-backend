import pool from "../db/database.js";
import crypto from "crypto";
import { sendTokenEmail } from "../helper/sendTokenEmail.js";
export const getAllUsers = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM register_users");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


export const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM register_users WHERE user_id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM register_users WHERE user_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}



export const createTempUser = async (req, res) => {
    const { username, email, temp_password, pin_hash , role_id } = req.body;
    console.log("body", req.body);

    if (!username || !email || !temp_password || !pin_hash  || !role_id) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Check if email already exists in permanent or temporary users
        const [existingUser] = await pool.query("SELECT * FROM register_users WHERE email = ?", [email]);
        const [existingTemp] = await pool.query("SELECT * FROM temporary_users WHERE email = ?", [email]);
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
        const values = [username, email, temp_password, pin_hash, token, tokenExpiresAt,role_id];
        const [result] = await pool.query(query, values);

        // Send token link
        const link = `https://yourdomain.com/set-password?token=${token}`;
        const emailSent = await sendTokenEmail(email, username, link,temp_password,pin_hash);

        if (!emailSent) {
            const query = "DELETE FROM temporary_users WHERE temp_id = ?";
            await pool.query(query, [result.insertId]);
            return res.status(500).json({ error: "Failed to send email. Try again later." });
        }
        return res.status(201).json({
            message: "Temporary user created successfully. Check email to set password and PIN.",
            userId: result.insertId
        });

    } catch (error) {
        console.error("Error creating temporary user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
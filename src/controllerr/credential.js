import pool from "../db/database.js";

export const createPasswordEntry = async (req, res) => {
  const {
    user_id,
    title,
    username,
    encrypted_password,
    url,
    notes,
    category_id,
  } = req.body;

  if (
    !title ||
    !username ||
    !encrypted_password ||
    !url ||
    !notes ||
    !category_id
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO passwords 
       (user_id, category_id, title, username, encrypted_password, url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        category_id || null,
        title,
        username || null,
        encrypted_password,
        url || null,
        notes || null,
      ]
    );

    res.json({ message: "Password created", password_id: result.insertId });
  } catch (error) {
    console.error("Error creating password entry:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sharePasswordEntry = async (req, res) => {
  try {
    const actorId = req.user.user_id;
    const { password_id, shared_with_user_id, permission_level } = req.body;

    if (!["VIEW", "EDIT"].includes(permission_level))
      return res.status(400).json({ error: "Invalid permission_level" });

    // Check if actor can share (owner or EDIT)
    const [pwRows] = await db.query(
      "SELECT user_id AS owner_user_id FROM passwords WHERE password_id = ?",
      [password_id]
    );
    if (!pwRows.length)
      return res.status(404).json({ error: "Password not found" });
    const ownerId = pwRows[0].owner_user_id;

    let allowed = actorId === ownerId;
    if (!allowed) {
      const [shareRows] = await db.query(
        "SELECT permission_level FROM shared_passwords WHERE password_id = ? AND shared_with_user_id = ?",
        [password_id, actorId]
      );
      if (shareRows.length && shareRows[0].permission_level === "EDIT")
        allowed = true;
    }
    if (!allowed)
      return res
        .status(403)
        .json({ error: "Not authorized to share this password" });

    // Upsert share
    const [existing] = await db.query(
      "SELECT share_id FROM shared_passwords WHERE password_id = ? AND shared_with_user_id = ?",
      [password_id, shared_with_user_id]
    );

    if (existing.length) {
      await db.query(
        "UPDATE shared_passwords SET permission_level = ?, shared_by_user_id = ?, shared_at = NOW() WHERE share_id = ?",
        [permission_level, actorId, existing[0].share_id]
      );
      return res.json({
        message: "Share updated",
        share_id: existing[0].share_id,
      });
    } else {
      const [result] = await db.query(
        "INSERT INTO shared_passwords (password_id, shared_by_user_id, shared_with_user_id, permission_level) VALUES (?, ?, ?, ?)",
        [password_id, actorId, shared_with_user_id, permission_level]
      );
      return res.json({
        message: "Password shared",
        share_id: result.insertId,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

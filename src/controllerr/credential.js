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
    const { user_id, password_id, shared_with_user_id, permission_level } =
      req.body;

    // 1. Validate permission level
    if (!["VIEW", "EDIT"].includes(permission_level)) {
      return res.status(400).json({ error: "Invalid permission_level" });
    }

    // 2. Check if password exists and find owner
    const [pwRows] = await pool.query(
      "SELECT user_id AS owner_id FROM passwords WHERE password_id = ?",
      [password_id]
    );
    if (!pwRows.length) {
      return res.status(404).json({ error: "Password not found" });
    }
    const ownerId = pwRows[0].owner_id;

    // 3. Verify if user_id is allowed (owner or has EDIT permission)
    let allowed = user_id === ownerId;
    if (!allowed) {
      const [shareRows] = await pool.query(
        "SELECT permission_level FROM shared_passwords WHERE password_id = ? AND shared_with_user_id = ?",
        [password_id, user_id]
      );
      if (shareRows.length && shareRows[0].permission_level === "EDIT") {
        allowed = true;
      }
    }
    if (!allowed) {
      return res
        .status(403)
        .json({ error: "Not authorized to share this password" });
    }

    // 4. Check if this password is already shared with the same user
    const [existing] = await pool.query(
      "SELECT share_id FROM shared_passwords WHERE password_id = ? AND shared_with_user_id = ?",
      [password_id, shared_with_user_id]
    );

    if (existing.length) {
      return res
        .status(409) // Conflict
        .json({ error: "Password already shared with this user" });
    }

    // 5. Insert new share record
    const [result] = await pool.query(
      `INSERT INTO shared_passwords 
         (password_id, shared_by_user_id, shared_with_user_id, permission_level)
       VALUES (?, ?, ?, ?)`,
      [password_id, user_id, shared_with_user_id, permission_level]
    );

    return res.json({
      message: "Password shared successfully",
      share_id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeSharedPassword = async (req, res) => {
  try {
    const { user_id, share_id } = req.body;

    // 1. Check if the share exists
    const [shareRows] = await pool.query(
      "SELECT password_id, shared_with_user_id FROM shared_passwords WHERE share_id = ?",
      [share_id]
    );

    if (!shareRows.length) {
      return res.status(404).json({ error: "Shared password not found" });
    }

    const { password_id, shared_with_user_id } = shareRows[0];
    console.log("Password ID:", password_id);
    console.log("Shared With User ID:", shared_with_user_id);

    // 2. Get the owner of the password
    const [pwRows] = await pool.query(
      "SELECT user_id AS owner_id FROM passwords WHERE password_id = ?",
      [password_id]
    );

    if (!pwRows.length) {
      return res.status(404).json({ error: "Password not found" });
    }

    const ownerId = pwRows[0].owner_id;

    // 3. Only owner can remove share
    if (user_id !== ownerId) {
      return res
        .status(403)
        .json({ error: "Only the owner can remove a shared password" });
    }

    // 4. Delete the share
    await pool.query("DELETE FROM shared_passwords WHERE share_id = ?", [
      share_id,
    ]);

    return res.json({
      message: `Password unshared from user ${shared_with_user_id}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const {
      user_id,
      password_id,
      title,
      username,
      encrypted_password,
      url,
      notes,
      category_id,
    } = req.body;

    // 1. Check if password exists & get owner
    const [pwRows] = await pool.query(
      "SELECT user_id AS owner_id FROM passwords WHERE password_id = ?",
      [password_id]
    );

    if (!pwRows.length) {
      return res.status(404).json({ error: "Password not found" });
    }

    const ownerId = pwRows[0].owner_id;

    // 2. Permission check
    let allowed = user_id === ownerId;

    if (!allowed) {
      const [shareRows] = await pool.query(
        "SELECT permission_level FROM shared_passwords WHERE password_id = ? AND shared_with_user_id = ?",
        [password_id, user_id]
      );

      if (shareRows.length && shareRows[0].permission_level === "EDIT") {
        allowed = true;
      }
    }

    if (!allowed) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this password" });
    }

    // 3. Update everything (owner or editor both allowed)
    await pool.query(
      `UPDATE passwords 
       SET title = ?, username = ?, encrypted_password = ?, url = ?, notes = ?, category_id = ?, updated_at = NOW()
       WHERE password_id = ?`,
      [
        title,
        username,
        encrypted_password,
        url,
        notes,
        category_id,
        password_id,
      ]
    );

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePassword = async (req, res) => {
  try {
    const { user_id, password_id } = req.body;

    // 1. Check if password exists
    const [pwRows] = await pool.query(
      "SELECT user_id AS owner_id FROM passwords WHERE password_id = ?",
      [password_id]
    );

    if (!pwRows.length) {
      return res.status(404).json({ error: "Password not found" });
    }

    const ownerId = pwRows[0].owner_id;

    // 2. Only owner can delete
    if (user_id !== ownerId) {
      return res
        .status(403)
        .json({ error: "Only the owner can delete this password" });
    }

    // 3. Delete the password (shared entries will be removed automatically via ON DELETE CASCADE)
    await pool.query("DELETE FROM passwords WHERE password_id = ?", [
      password_id,
    ]);

    return res.json({ message: "Password deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

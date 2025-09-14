import pool from "../db/database.js";

export const getRoles = async (req, res) => {
  try {
    const [roles] = await pool.query("SELECT * FROM roles");
    res.status(200).json({ data: roles, status: "success" });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Internal server error", status: "error" });
  }
};

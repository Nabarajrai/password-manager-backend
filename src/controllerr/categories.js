import pool from "../db/database.js";

export const getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query("SELECT * FROM categories");
    res.status(200).json({ data: categories, status: "success" });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal server error", status: "error" });
  }
};

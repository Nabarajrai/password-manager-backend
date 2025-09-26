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

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE categories SET name = ? WHERE category_id = ?",
      [name, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Category not found", status: "error" });
    }

    res
      .status(200)
      .json({ message: "Category updated successfully", status: "success" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Internal server error", status: "error" });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM categories WHERE category_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Category not found", status: "error" });
    }

    res
      .status(200)
      .json({ message: "Category deleted successfully", status: "success" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Internal server error", status: "error" });
  }
};

export const createCategory = async (req, res) => {
  const { name, userId } = req.body;

  try {
    const [result] = await pool.query(
      "INSERT INTO categories (name,user_id) VALUES (?,?)",
      [name, userId]
    );

    res.status(201).json({
      message: "Category created successfully",
      categoryId: result.insertId,
      status: "success",
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Internal server error", status: "error" });
  }
};

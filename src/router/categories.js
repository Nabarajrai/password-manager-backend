import express from "express";
import {
  getAllCategories,
  updateCategory,
  deleteCategory,
  createCategory,
} from "../controllerr/categories.js";
const router = express.Router();

// Define your category routes here
router.get("/get-all-categories", getAllCategories);
router.put("/update-category/:id", updateCategory);
router.delete("/delete-category/:id", deleteCategory);
router.post("/create-category", createCategory);

export default router;

import express from "express";
import { getAllCategories } from "../controllerr/categories.js";
const router = express.Router();

// Define your category routes here
router.get("/get-all-categories", getAllCategories);

export default router;

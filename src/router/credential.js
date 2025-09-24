import express from "express";
//controllers
import {
  createPasswordEntry,
  sharePasswordEntry,
  removeSharedPassword,
  updatePassword,
  deletePassword,
  getAllPasswords,
  getPasswordById,
} from "../controllerr/credential.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-password", authenticateToken, createPasswordEntry);
router.post("/share-password", authenticateToken, sharePasswordEntry);
router.delete(
  "/remove-shared-password",
  authenticateToken,
  removeSharedPassword
);
router.put("/update-password", authenticateToken, updatePassword);
router.delete("/remove-password", authenticateToken, deletePassword);
router.get("/get-all-passwords", authenticateToken, getAllPasswords);
router.get("/get-password-by-id", authenticateToken, getPasswordById);

export default router;

import express from "express";

import {
  getAllUsers,
  getUserById,
  deleteUser,
  createTempUser,
  updatePasswordAndPin,
  sentResetPasswordLink,
  sentResetPinLink,
  resetPassword,
  resetPin,
  getAllTempUsers,
} from "../controllerr/user.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/allUsers", authenticateToken, getAllUsers);
router.get("/getUserById/:id", authenticateToken, getUserById);
router.delete("/delete-user", authenticateToken, deleteUser);
router.post("/create-user-by-admin", authenticateToken, createTempUser);
router.post("/update-password-pin", authenticateToken, updatePasswordAndPin);
router.post(
  "/send-reset-password-link",
  authenticateToken,
  sentResetPasswordLink
);
router.post("/send-reset-pin-link", authenticateToken, sentResetPinLink);
router.patch("/reset-password", authenticateToken, resetPassword);
router.patch("/reset-pin", authenticateToken, resetPin);
router.get("/all-temp-users", authenticateToken, getAllTempUsers);

export default router;

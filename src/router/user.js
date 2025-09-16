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
  deleteTempUser,
  getUserCounts,
} from "../controllerr/user.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/allUsers", authenticateToken, getAllUsers);
router.get("/getUserById/:id", authenticateToken, getUserById);
router.delete("/delete-user", authenticateToken, deleteUser);
router.post("/create-user-by-admin", authenticateToken, createTempUser);
router.post("/update-password-pin", updatePasswordAndPin);
router.post(
  "/send-reset-password-link",
  authenticateToken,
  sentResetPasswordLink
);
router.post("/send-reset-pin-link", authenticateToken, sentResetPasswordLink);
router.patch("/reset-password", resetPassword);
router.patch("/reset-pin", resetPin);
router.get("/all-temp-users", authenticateToken, getAllTempUsers);
router.delete("/delete-temp-user", authenticateToken, deleteTempUser);
router.get("/user-counts", authenticateToken, getUserCounts);

export default router;

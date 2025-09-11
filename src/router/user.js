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
} from "../controllerr/user.js";
// import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/allUsers", getAllUsers);
router.get("/getUserById", getUserById);
router.delete("/delete-user", deleteUser);
router.post("/create-user-by-admin", createTempUser);
router.post("/update-password-pin", updatePasswordAndPin);
router.post("/send-reset-password-link", sentResetPasswordLink);
router.post("/send-reset-pin-link", sentResetPinLink);
router.patch("/reset-password", resetPassword);
router.patch("/reset-pin", resetPin);

export default router;

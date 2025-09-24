import express from "express";
//controllers
import {
  registerUser,
  loginUser,
  logOutUser,
  forgotAdminPassword,
  pinServiceStatus,
} from "../controllerr/auth.js";

//middleware
import { authenticateToken } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logOutUser);
router.post("/forgot-admin-password", forgotAdminPassword);
router.post("/pin-service", authenticateToken, pinServiceStatus);

export default router;

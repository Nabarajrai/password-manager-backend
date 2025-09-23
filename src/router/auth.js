import express from "express";
//controllers
import {
  registerUser,
  loginUser,
  logOutUser,
  forgotAdminPassword,
  pinServiceStatus,
} from "../controllerr/auth.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logOutUser);
router.post("/forgot-admin-password", forgotAdminPassword);
router.post("/pin-service", pinServiceStatus);

export default router;

import express from "express";
//controllers
import { registerUser, loginUser, logOutUser } from "../controllerr/auth.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logOutUser);

export default router;


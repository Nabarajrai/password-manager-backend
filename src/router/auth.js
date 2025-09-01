import express from "express";
//controllers
import { registerUser } from "../controllerr/auth.js";
const router = express.Router();

router.post("/register", registerUser);

export default router;

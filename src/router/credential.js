import express from "express";
//controllers
import { createPasswordEntry } from "../controllerr/credential.js";
const router = express.Router();

router.post("/create-password", createPasswordEntry);

export default router;

import express from "express";
import { getRoles } from "../controllerr/roles.js";

const router = express.Router();

router.get("/roles", getRoles);

export default router;

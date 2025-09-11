import express from "express";
//controllers
import {
  createPasswordEntry,
  sharePasswordEntry,
  removeSharedPassword,
} from "../controllerr/credential.js";
const router = express.Router();

router.post("/create-password", createPasswordEntry);
router.post("/share-password", sharePasswordEntry);
router.delete("/remove-shared-password", removeSharedPassword);

export default router;

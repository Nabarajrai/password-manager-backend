import express from "express";
//controllers
import {
  createPasswordEntry,
  sharePasswordEntry,
  removeSharedPassword,
  updatePassword,
  deletePassword,
} from "../controllerr/credential.js";

const router = express.Router();

router.post("/create-password", createPasswordEntry);
router.post("/share-password", sharePasswordEntry);
router.delete("/remove-shared-password", removeSharedPassword);
router.put("/update-password", updatePassword);
router.delete("/remove-password", deletePassword);

export default router;

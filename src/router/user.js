import express from "express";

import {
  getAllUsers,
  getUserById,
  deleteUser,
  createTempUser,
  updatePasswordAndPin,
} from "../controllerr/user.js";

const router = express.Router();

router.get("/allUsers", getAllUsers);
router.get("/getUserById", getUserById);
router.delete("/delete-user", deleteUser);
router.post("/create-user-by-admin", createTempUser);
router.post("/update-password-pin", updatePasswordAndPin);

export default router;

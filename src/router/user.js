import express from "express"

import { getAllUsers, getUserById, deleteUser, createTempUser } from "../controllerr/user.js";


 const router = express.Router();

router.get("/allUsers", getAllUsers);
router.get("/getUserById", getUserById);
router.delete("/delete-user", deleteUser);
router.post("/create-user-by-admin", createTempUser);

export default router;
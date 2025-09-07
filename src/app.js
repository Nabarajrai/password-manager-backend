import express from "express";
import dotenv from "dotenv";
//controler
import authRouter from "./router/auth.js";
import userRouter from "./router/user.js";

const app = express();
app.use(express.json());
dotenv.config();

app.get("/", (req, res) => {
  return res.send("hello world");
});

app.use("/api/auth", authRouter);
app.use("/api", userRouter);

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

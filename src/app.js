import express from "express";
import dotenv from "dotenv";
//controler
import authRouter from "./router/auth.js";
import userRouter from "./router/user.js";
import passwordRouter from "./router/credential.js";

const app = express();
app.use(express.json());
dotenv.config();

const PORT = process.env.PORT || 3000;

console.log(process.env.JWT_SECRET);
app.get("/", (req, res) => {
  return res.send("hello world");
});

app.use("/api/auth", authRouter);
app.use("/api", userRouter);
app.use("/api", passwordRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

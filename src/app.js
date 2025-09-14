import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

//controler
import authRouter from "./router/auth.js";
import userRouter from "./router/user.js";
import passwordRouter from "./router/credential.js";
import useCategoriesRouter from "./router/categories.js";
import useRoles from "./router/roles.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
dotenv.config();

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // allow cookies if needed
  })
);
app.get("/", (req, res) => {
  return res.send("hello world");
});

app.use("/api/auth", authRouter);
app.use("/api", userRouter);
app.use("/api", passwordRouter);
app.use("/api", useCategoriesRouter);
app.use("/api", useRoles);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

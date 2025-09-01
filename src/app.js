import express from "express";
//controler
import authRouter from "./router/auth.js";

const app = express();

app.get("/", (req, res) => {
  return res.send("hello world");
});

app.use("/api/auth", authRouter);

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

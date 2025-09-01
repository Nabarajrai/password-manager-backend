import express from "express";
const app = express();

app.get("/", (req, res) => {
  return res.send("hello world");
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/test", (req, res) => {
  res.send("Hello dev");
});


app.get("/pm25", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "data", "pm25.json")
  );
});


app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Internal Server Error"
  });
});

export default app;

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db/db.js";
import { error } from "console";

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

app.get("/pm25/monthly", async(req, res) => {
  try{
    
    const results = await pool.query(`
      SELECT * FROM monthly_pm25
      ORDER BY city, month
    `);
    console.log(results.rows);
    console.log(results);
    res.send("hello");
    //for now let's just see first
  } catch (error) {
    console.error("problem in getting monthly data : ", error.message);
  }
})

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Internal Server Error"
  });
});

export default app;

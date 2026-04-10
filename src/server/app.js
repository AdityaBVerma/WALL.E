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


/**
 * "/pm25/monthly"
 * [
    {
      "city": "2912 Coffey",
      "month_label": "March 2026",
      "year": 2026,
      "month": 3,
      "avg_pm25": 1.5
    },
    {
      "city": "2912 Coffey",
      "month_label": "April 2026",
      "year": 2026,
      "month": 4,
      "avg_pm25": 6
    }
  ]
*/
app.get("/pm25/monthly", async(req, res) => {
  try{
    
    const results = await pool.query(`
      SELECT * FROM monthly_pm25
      ORDER BY city, month
    `);

    const formatted = results.rows.map(row => ({
      city: row.city,
      month_label: new Date(row.month).toLocaleString("en-IN", {
        month: "long",
        year: "numeric"
      }),
      year: new Date(row.month).getUTCFullYear(),
      month: new Date(row.month).getUTCMonth() + 1,
      avg_pm25: row.avg_pm25
    }));
    res.json(formatted);
  } catch (error) {
    console.error("problem in getting monthly data : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
})

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Internal Server Error"
  });
});

export default app;

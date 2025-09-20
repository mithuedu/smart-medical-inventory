require("dotenv").config();
const express = require("express");
const app = express();
const pool = require("./Config/db");

const authRoutes = require("./Router/authRoutes");
const appointmentRoutes = require("./Router/appointmentRoutes");
const doctorRoutes = require("./Router/doctorRoutes");

const cors = require('cors');

const corsOptions = {
  origin: ['http://localhost:5174','https://frontend-medicinal-customer-2.onrender.com'],            // allow only dev origin
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,                          // if you use cookies/credentials
  optionsSuccessStatus: 204
};

app.use(cors());

app.use(express.json());

// Startup info
console.log("Starting server...");
console.log("PID:", process.pid);
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
console.log("NODE_ENV:", process.env.NODE_ENV || "not set");

app.get("/health", async (req, res) => {
  const TIMER_MS = 7000;
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      try { res.status(504).json({ ok: false, error: "Health timed out" }); }
      catch (e) { /* ignore */ }
    }
  }, TIMER_MS);

  try {
    const t0 = Date.now();
    const result = await pool.query("SELECT 1 AS ok");
    const took = Date.now() - t0;
    clearTimeout(timer);
    return res.json({ ok: true, db: result.rows[0], tookMs: took });
  } catch (err) {
    clearTimeout(timer);
    console.error("[/health] DB error:", err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: "DB connection failed", details: err && err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes);




app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

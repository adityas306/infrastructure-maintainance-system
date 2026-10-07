require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

connectDB();

/* =========================
   CORS CONFIGURATION
========================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",

  // Vercel production
  "https://projects-rose-nine.vercel.app",

  // Current Vercel deployment
  "https://projects-p5z7vbb8u-dev-storm1.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an origin
    // (Postman, server-to-server, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked CORS origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

/* CORS MUST COME BEFORE ROUTES */
app.use(cors(corsOptions));

/* Explicitly handle preflight requests */
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "2mb" }));

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "InfraCare API is running",
    version: "2.0",
    architecture: "multi-organisation RBAC",
  });
});

/* =========================
   API ROUTES
========================= */

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/assets", require("./routes/assetRoutes"));
app.use("/api/tickets", require("./routes/ticketRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error(err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS: Origin not allowed",
    });
  }

  res.status(500).json({
    message: "Internal server error",
  });
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`InfraCare API running on port ${PORT}`);
});
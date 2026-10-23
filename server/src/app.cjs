const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Middleware
const errorHandler = require("./middleware/errorHandler.cjs");
const { createRateLimiter } = require("./middleware/rateLimiter.cjs");

// Routes
const healthRoutes = require("./routes/health.cjs");
const configRoutes = require("./routes/config.cjs");
const authRoutes = require("./routes/auth.cjs");
const ngosRoutes = require("./routes/ngos.cjs");
const donationsRoutes = require("./routes/donations.cjs");
const transparencyRoutes = require("./routes/transparency.cjs");
const reportsRoutes = require("./routes/reports.cjs");
const projectsRoutes = require("./routes/projects.cjs");
const adminRoutes = require("./routes/admin.cjs");
const onboardingRoutes = require("./routes/onboarding.cjs");
const teamRoutes = require("./routes/team.cjs");
const governanceRoutes = require("./routes/governance.cjs");
const reconciliationRoutes = require("./routes/reconciliation.cjs");
const riskRoutes = require("./routes/risk.cjs");
const auditsRoutes = require("./routes/audits.cjs");
const notificationsRoutes = require("./routes/notifications.cjs");

const app = express();

// Security Headers & CORS
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Rate Limiter on sensitive endpoints
const authLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 120 });

// Structured Request Logging (Sanitized)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "test") {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// API Routes (v1)
app.use("/api/v1", healthRoutes);
app.use("/api/v1", configRoutes);
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/ngos", ngosRoutes);
app.use("/api/v1/ngos", teamRoutes);
app.use("/api/v1/donations", donationsRoutes);
app.use("/api/v1", transparencyRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/projects", projectsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);
app.use("/api/v1", governanceRoutes);
app.use("/api/v1", reconciliationRoutes);
app.use("/api/v1/risk", riskRoutes);
app.use("/api/v1/audits", auditsRoutes);
app.use("/api/v1/notifications", notificationsRoutes);

// Root fallback
app.get("/", (req, res) => {
  res.json({
    name: "TrustDonate Blockchain & Backend API",
    version: "1.0.0",
    apiDocs: "/api/v1/health",
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;

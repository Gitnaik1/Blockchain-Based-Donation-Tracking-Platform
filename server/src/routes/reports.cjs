const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");
const ipfsService = require("../services/ipfsService.cjs");
const { requireNgoAdmin } = require("../middleware/authMiddleware.cjs");

// Seed initial reports if empty
const count = db.prepare("SELECT COUNT(*) AS count FROM reports").get().count;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO reports (id, ngo_id, project_id, title, ipfs_cid, beneficiaries, auditor, summary, evidence_count, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED_ON_CHAIN', ?)
  `);

  insert.run(
    "rep-1",
    "ngo-1",
    "proj-1",
    "Q1 2026: Clean Water Initiative Borewell Phase 1",
    "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    "4,200 Villagers",
    "Deloitte Social Impact Practice",
    "Successfully completed deep borewell drilling and installed dual solar submersible pump units.",
    "8 Photos • 2 Water Purity Lab Certificates",
    "2026-05-15 14:00:00"
  );
  insert.run(
    "rep-2",
    "ngo-2",
    "proj-2",
    "Digital Classrooms Hardware Deployment Audit",
    "QmZtmD2qt8fQg7zEBrS9h7b2XU2U1B6k4R3d9v8x7P6q5W",
    "680 Schoolchildren",
    "EduTrust Independent Observers",
    "Procured and delivered 50 ruggedized Android educational tablets with localized syllabus.",
    "12 Serialized Asset Receipts • Teacher Attestations",
    "2026-05-02 11:30:00"
  );
}

router.get("/", (req, res) => {
  const ngoId = req.query.ngoId;
  let query = "SELECT r.*, n.name AS ngo_name FROM reports r JOIN ngos n ON r.ngo_id = n.id";
  const params = [];

  if (ngoId) {
    query += " WHERE r.ngo_id = ?";
    params.push(ngoId);
  }
  query += " ORDER BY r.created_at DESC";

  const reports = db.prepare(query).all(...params);
  res.json({
    success: true,
    data: reports,
  });
});

router.get("/:id", (req, res) => {
  const report = db.prepare("SELECT r.*, n.name AS ngo_name FROM reports r JOIN ngos n ON r.ngo_id = n.id WHERE r.id = ?").get(req.params.id);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: { code: "REPORT_NOT_FOUND", message: "Impact report not found." },
    });
  }

  const ipfsDetails = ipfsService.resolveCid(report.ipfs_cid);

  res.json({
    success: true,
    data: {
      ...report,
      ipfsDetails,
    },
  });
});

router.post("/", (req, res, next) => {
  try {
    const { title, project, beneficiaries, auditor, summary, ngoId = "ngo-1" } = req.body;
    if (!title || !summary) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_REPORT", message: "Title and summary are required." },
      });
    }

    // Generate content-addressed CID for this report summary
    const reportBuffer = Buffer.from(JSON.stringify({ title, project, beneficiaries, auditor, summary, publishedAt: new Date().toISOString() }));
    const { cid } = ipfsService.generateCid(reportBuffer);

    const reportId = `rep-${Date.now()}`;
    db.prepare(`
      INSERT INTO reports (id, ngo_id, title, ipfs_cid, beneficiaries, auditor, summary, evidence_count, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Attached Documentation Pinned to IPFS', 'VERIFIED_ON_CHAIN', CURRENT_TIMESTAMP)
    `).run(
      reportId,
      ngoId,
      title,
      cid,
      beneficiaries || "Community Beneficiaries",
      auditor || "Independent Observer",
      summary
    );

    const created = db.prepare("SELECT * FROM reports WHERE id = ?").get(reportId);
    res.json({
      success: true,
      data: created,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

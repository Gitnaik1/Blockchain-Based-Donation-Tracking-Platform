const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");

// Seed initial projects if empty
const count = db.prepare("SELECT COUNT(*) AS count FROM projects").get().count;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO projects (id, ngo_id, name, description, wallet, target_inr, allocated_inr, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `);

  insert.run(
    "proj-1",
    "ngo-1",
    "Clean Water Initiative",
    "Borewell installation in drought-hit village cluster.",
    "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
    450000,
    450000
  );
  insert.run(
    "proj-2",
    "ngo-2",
    "Education for All",
    "Digital lab equipment & high-speed satellite connectivity.",
    "0x2D4aB9185aC9204910e527027167520e5436814E",
    800000,
    800000
  );
  insert.run(
    "proj-3",
    "ngo-3",
    "Healthcare Access Program",
    "Mobile health dispensary & vaccination cold-chain storage.",
    "0x91F5B612E0987c320dE51A186B1095d315682C89",
    1200000,
    1200000
  );
}

router.get("/", (req, res) => {
  const ngoId = req.query.ngoId;
  let query = "SELECT * FROM projects";
  const params = [];
  if (ngoId) {
    query += " WHERE ngo_id = ?";
    params.push(ngoId);
  }

  const projects = db.prepare(query).all(...params);
  res.json({
    success: true,
    data: projects,
  });
});

router.get("/:id/milestones", (req, res) => {
  const milestones = db.prepare("SELECT * FROM milestones WHERE project_id = ?").all(req.params.id);
  res.json({
    success: true,
    data: milestones,
  });
});

router.post("/:id/milestones/propose", (req, res, next) => {
  try {
    const { title, tokenSymbol = "POL", tokenAddress, amountRaw, amountFormatted, recipientWallet, ipfsInvoiceCid, deadline } = req.body;
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "PROJECT_NOT_FOUND", message: "Project not found" },
      });
    }

    const milestoneId = `mile-${Date.now()}`;
    db.prepare(`
      INSERT INTO milestones (
        id, project_id, ngo_id, title, token_symbol, token_address, amount_raw,
        amount_formatted, recipient_wallet, ipfs_invoice_cid, deadline, approval_count,
        required_approvals, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 3, 'PROPOSED')
    `).run(
      milestoneId,
      project.id,
      project.ngo_id,
      title,
      tokenSymbol,
      tokenAddress || "0x0000000000000000000000000000000000000000",
      amountRaw || "1000000000000000000",
      amountFormatted || "1.0 POL",
      recipientWallet || project.wallet,
      ipfsInvoiceCid || "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      deadline || Math.floor(Date.now() / 1000) + 7 * 86400
    );

    const created = db.prepare("SELECT * FROM milestones WHERE id = ?").get(milestoneId);
    res.json({
      success: true,
      data: created,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

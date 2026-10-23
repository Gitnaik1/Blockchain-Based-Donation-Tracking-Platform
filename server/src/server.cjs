require("dotenv").config();
const app = require("./app.cjs");
const indexerService = require("./services/indexerService.cjs");

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log("=================================================");
  console.log(`TrustDonate API Server listening on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`Config:       http://localhost:${PORT}/api/v1/config`);
  console.log("=================================================");

  // Kick off background event indexer sync
  indexerService
    .syncRecentBlocks()
    .then((res) => {
      console.log(`[IndexerService] Initial block sync status: ${res.status}`);
    })
    .catch((err) => {
      console.warn(`[IndexerService] Initial sync check: ${err.message}`);
    });
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Shutting down gracefully...");
  server.close(() => {
    process.exit(0);
  });
});

module.exports = server;

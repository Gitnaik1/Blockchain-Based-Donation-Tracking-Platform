const { expect } = require("chai");
const http = require("http");
const { ethers } = require("ethers");
const app = require("../src/app.cjs");

describe("TrustDonate Backend API Integration Tests", function () {
  let server;
  let baseUrl;
  let testWallet;

  before(function (done) {
    process.env.NODE_ENV = "test";
    testWallet = ethers.Wallet.createRandom();

    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  after(function (done) {
    server.close(done);
  });

  async function apiGet(path) {
    const res = await fetch(`${baseUrl}${path}`);
    const data = await res.json();
    return { status: res.status, body: data };
  }

  async function apiPost(path, body, headers = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, body: data };
  }

  describe("System Health & Config", function () {
    it("GET /api/v1/health should return system status and chain parameters", async function () {
      const res = await apiGet("/api/v1/health");
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.status).to.equal("HEALTHY");
      expect(res.body.data.chainId).to.be.a("number");
    });

    it("GET /api/v1/config should return supported tokens and contract registry", async function () {
      const res = await apiGet("/api/v1/config");
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.supportedTokens).to.be.an("array");
      expect(res.body.data.supportedTokens.length).to.be.greaterThan(0);
    });
  });

  describe("NGO Management Endpoints", function () {
    it("GET /api/v1/ngos should return list of verified NGOs", async function () {
      const res = await apiGet("/api/v1/ngos");
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an("array");
      expect(res.body.data.length).to.be.at.least(3);
    });

    it("GET /api/v1/ngos/:id should return single NGO details", async function () {
      const res = await apiGet("/api/v1/ngos/ngo-1");
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.name).to.equal("Green Canopy Initiative");
    });

    it("GET /api/v1/ngos/invalid should return 404", async function () {
      const res = await apiGet("/api/v1/ngos/ngo-nonexistent");
      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.error.code).to.equal("NGO_NOT_FOUND");
    });
  });

  describe("Donation Lifecycle Endpoints", function () {
    it("POST /api/v1/donations/prepare should return signing parameters for USDC", async function () {
      const res = await apiPost("/api/v1/donations/prepare", {
        ngoId: "ngo-1",
        tokenSymbol: "USDC",
        amount: "150.00",
        donorAddress: testWallet.address,
      });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.tokenSymbol).to.equal("USDC");
      expect(res.body.data.amountRaw).to.equal("150000000"); // 150 * 10^6
      expect(res.body.data.requiresApproval).to.be.true;
    });

    it("POST /api/v1/donations/record should record confirmed transaction and issue 80G receipt", async function () {
      const testTxHash = `0x${ethers.hexlify(ethers.randomBytes(32)).substring(2)}`;
      const res = await apiPost("/api/v1/donations/record", {
        txHash: testTxHash,
        blockNumber: 12489350,
        ngoId: "ngo-1",
        donorAddress: testWallet.address,
        donorName: "Siddharth Verma",
        tokenSymbol: "USDC",
        amount: "100.00",
      });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.tx_hash).to.equal(testTxHash);
      expect(res.body.data.tax_receipt_no).to.match(/^80G-2026-\d{4}$/);

      // Verify retrieval by hash
      const getRes = await apiGet(`/api/v1/donations/by-tx/${testTxHash}`);
      expect(getRes.status).to.equal(200);
      expect(getRes.body.data.tax_receipt_no).to.equal(res.body.data.tax_receipt_no);
    });

    it("GET /api/v1/donations should return ledger with summary totals", async function () {
      const res = await apiGet("/api/v1/donations");
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an("array");
      expect(res.body.summary.totalVolumeInr).to.be.a("number");
      expect(res.body.summary.confirmedTransactions).to.be.at.least(3);
    });
  });

  describe("Wallet SIWE Authentication", function () {
    it("POST /api/v1/auth/challenge should return cryptographic nonce and formatted message", async function () {
      const res = await apiPost("/api/v1/auth/challenge", {
        address: testWallet.address,
      });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.nonce).to.be.a("string");
      expect(res.body.data.message).to.include(testWallet.address);
    });

    it("POST /api/v1/auth/verify should authenticate signed challenge and return session JWT", async function () {
      // 1. Get challenge
      const chalRes = await apiPost("/api/v1/auth/challenge", {
        address: testWallet.address,
      });
      const message = chalRes.body.data.message;

      // 2. Sign message with wallet
      const signature = await testWallet.signMessage(message);

      // 3. Verify
      const verifyRes = await apiPost("/api/v1/auth/verify", {
        message,
        signature,
      });

      expect(verifyRes.status).to.equal(200);
      expect(verifyRes.body.success).to.be.true;
      expect(verifyRes.body.data.token).to.be.a("string");
      expect(verifyRes.body.data.wallet.toLowerCase()).to.equal(testWallet.address.toLowerCase());

      // 4. Test authenticated session endpoint
      const sessionRes = await apiGet("/api/v1/auth/session");
      expect(sessionRes.status).to.equal(401); // without bearer

      const authSessionRes = await fetch(`${baseUrl}/api/v1/auth/session`, {
        headers: { Authorization: `Bearer ${verifyRes.body.data.token}` },
      }).then((r) => r.json());

      expect(authSessionRes.success).to.be.true;
      expect(authSessionRes.data.address.toLowerCase()).to.equal(testWallet.address.toLowerCase());
    });
  });

  describe("Transparency & IPFS Reports", function () {
    it("GET /api/v1/transactions/:txHash should return full verification pipeline", async function () {
      const res = await apiGet("/api/v1/transactions/0x3f5c2901a812b4e72d93e114f6b21908a812b4e7");
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.status).to.equal("CONFIRMED_FINALIZED");
      expect(res.body.data.initiator).to.be.an("object");
    });

    it("GET /api/v1/reports should return verified reports with IPFS CIDs", async function () {
      const res = await apiGet("/api/v1/reports");
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.length).to.be.at.least(2);
      expect(res.body.data[0].ipfs_cid).to.be.a("string");
    });
  });
});

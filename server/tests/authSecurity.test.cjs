const { expect } = require("chai");
const crypto = require("crypto");
const { ethers } = require("ethers");
const app = require("../src/app.cjs");
const db = require("../src/db/database.cjs");
const authService = require("../src/services/authService.cjs");
const onboardingService = require("../src/services/onboardingService.cjs");
const { callApp, createTestToken, apiGet, apiPost, apiPatch, apiDelete } = require("./testHelper.cjs");
const { getPermissionsForRoles } = require("../src/rbac/permissions.cjs");

describe("TrustDonate Authentication, RBAC, Donor Lifecycle & Security Verification", function () {
  let superAdminToken;
  let testWallet1;
  let testWallet2;
  let testDonorUser;

  before(function () {
    process.env.NODE_ENV = "test";
    testWallet1 = ethers.Wallet.createRandom();
    testWallet2 = ethers.Wallet.createRandom();

    superAdminToken = createTestToken(
      "usr-superadmin",
      "0x51E2aC9005934571A3793f0bB75A1F7096e1304B",
      "PLATFORM_SUPER_ADMIN",
      "PLATFORM_SUPER_ADMIN",
      null,
      getPermissionsForRoles(["PLATFORM_SUPER_ADMIN"])
    );
  });

  describe("1. Wallet Authentication & Cryptographic SIWE Challenges", function () {
    it("fails challenge request if wallet address is malformed or omitted", async function () {
      const res1 = await apiPost(app, "/api/v1/auth/challenge", {});
      expect(res1.status).to.equal(400);
      expect(res1.body.error.code).to.equal("MISSING_ADDRESS");

      const res2 = await apiPost(app, "/api/v1/auth/challenge", { address: "invalid-eth-address" });
      expect(res2.status).to.equal(500); // Caught by global error handler
    });

    it("issues a single-use unpredictable challenge bound to domain and chain", async function () {
      const res = await apiPost(app, "/api/v1/auth/challenge", {
        address: testWallet1.address,
      });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.nonce).to.be.a("string");
      expect(res.body.data.message).to.include("trustdonate.org");
      expect(res.body.data.message).to.include("Chain ID: 80002");
    });

    it("prevents challenge replay attacks (single-use challenge verification)", async function () {
      // 1. Get challenge
      const chalRes = await apiPost(app, "/api/v1/auth/challenge", { address: testWallet1.address });
      const { message, nonce } = chalRes.body.data;

      // 2. Sign message
      const signature = await testWallet1.signMessage(message);

      // 3. First verification succeeds
      const verify1 = await apiPost(app, "/api/v1/auth/verify", { message, signature });
      expect(verify1.status).to.equal(200);
      expect(verify1.body.success).to.be.true;
      expect(verify1.body.data.token).to.be.a("string");

      // 4. Second verification with same challenge must be rejected (replay attack prevention)
      const verify2 = await apiPost(app, "/api/v1/auth/verify", { message, signature });
      expect(verify2.status).to.equal(401);
      expect(verify2.body.error.message).to.include("previously consumed");
    });

    it("rejects expired login challenges", async function () {
      const chalRes = await apiPost(app, "/api/v1/auth/challenge", { address: testWallet1.address });
      const { message, nonce } = chalRes.body.data;

      // Force challenge to be expired in database
      db.prepare("UPDATE auth_challenges SET expires_at = ? WHERE nonce = ?").run(Date.now() - 1000, nonce);

      const signature = await testWallet1.signMessage(message);
      const res = await apiPost(app, "/api/v1/auth/verify", { message, signature });

      expect(res.status).to.equal(401);
      expect(res.body.error.message).to.include("expired");
    });

    it("rejects invalid or forged wallet signatures", async function () {
      const chalRes = await apiPost(app, "/api/v1/auth/challenge", { address: testWallet1.address });
      const { message } = chalRes.body.data;

      // Wallet 2 signs challenge meant for Wallet 1
      const forgedSig = await testWallet2.signMessage(message);
      const res = await apiPost(app, "/api/v1/auth/verify", { message, signature: forgedSig });

      expect(res.status).to.equal(401);
      expect(res.body.error.message).to.include("does not match challenged address");
    });
  });

  describe("2. Donor Account Registration & Password Lifecycle", function () {
    const testEmail = `donor_${Date.now()}@example.com`;
    const testPassword = "StrongPassword123!";

    it("rejects signup when terms or privacy policy are not accepted", async function () {
      const res = await apiPost(app, "/api/v1/auth/signup", {
        email: "noterms@example.com",
        password: testPassword,
        acceptedTerms: false,
        acceptedPrivacy: true,
      });

      expect(res.status).to.equal(400);
      expect(res.body.error.message).to.include("Terms of Service");
    });

    it("rejects signup with weak passwords", async function () {
      const res = await apiPost(app, "/api/v1/auth/signup", {
        email: "weakpass@example.com",
        password: "weak",
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

      expect(res.status).to.equal(400);
      expect(res.body.error.message).to.include("at least 8 characters");
    });

    it("registers a new donor and normalizes email address", async function () {
      const res = await apiPost(app, "/api/v1/auth/signup", {
        email: `  ${testEmail.toUpperCase()}  `,
        password: testPassword,
        displayName: "Test Donor 1",
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.data.email).to.equal(testEmail.toLowerCase());
      expect(res.body.data.globalRole).to.equal("DONOR");
      expect(res.body.data.verificationToken).to.be.a("string");

      testDonorUser = res.body.data;
    });

    it("rejects duplicate email registrations with 409 Conflict", async function () {
      const res = await apiPost(app, "/api/v1/auth/signup", {
        email: testEmail.toLowerCase(),
        password: testPassword,
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

      expect(res.status).to.equal(409);
      expect(res.body.error.code).to.equal("EMAIL_ALREADY_EXISTS");
    });

    it("verifies email with single-use verification token", async function () {
      const verifyRes = await apiPost(app, "/api/v1/auth/verify-email", {
        token: testDonorUser.verificationToken,
      });

      expect(verifyRes.status).to.equal(200);
      expect(verifyRes.body.success).to.be.true;

      // Reusing token must fail
      const reuseRes = await apiPost(app, "/api/v1/auth/verify-email", {
        token: testDonorUser.verificationToken,
      });
      expect(reuseRes.status).to.equal(400);
    });

    it("authenticates via password login and returns sanitized session", async function () {
      const res = await apiPost(app, "/api/v1/auth/login", {
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.token).to.be.a("string");
      expect(res.body.data.email).to.equal(testEmail.toLowerCase());
      expect(res.body.data.password_hash).to.be.undefined; // Never leaks password hash
    });

    it("returns generic login failure and enforces account lockout after 5 failed attempts", async function () {
      // 4 failed attempts
      for (let i = 0; i < 4; i++) {
        const failRes = await apiPost(app, "/api/v1/auth/login", {
          email: testEmail,
          password: "WrongPassword!",
        });
        expect(failRes.status).to.equal(401);
        expect(failRes.body.error.message).to.equal("Invalid email or password.");
      }

      // 5th failed attempt triggers lockout
      const lockRes = await apiPost(app, "/api/v1/auth/login", {
        email: testEmail,
        password: "WrongPassword!",
      });
      expect(lockRes.status).to.equal(401);
      expect(lockRes.body.error.message).to.include("locked");

      // Even correct password is now blocked while locked
      const correctRes = await apiPost(app, "/api/v1/auth/login", {
        email: testEmail,
        password: testPassword,
      });
      expect(correctRes.status).to.equal(401);
      expect(correctRes.body.error.message).to.include("temporarily locked");

      // Reset lockout for following tests
      db.prepare("UPDATE users SET failed_login_attempts = 0, locked_until = 0 WHERE email = ?").run(testEmail.toLowerCase());
    });

    it("executes password reset flow and rejects token replay", async function () {
      // 1. Request reset
      const reqRes = await apiPost(app, "/api/v1/auth/forgot-password", { email: testEmail });
      expect(reqRes.status).to.equal(200);
      expect(reqRes.body.message).to.include("dispatched");
      const resetToken = reqRes.body.debugToken;
      expect(resetToken).to.be.a("string");

      // 2. Perform reset
      const newPassword = "BrandNewPassword2026!";
      const resetRes = await apiPost(app, "/api/v1/auth/reset-password", {
        token: resetToken,
        newPassword,
      });
      expect(resetRes.status).to.equal(200);

      // 3. Token replay fails
      const replayRes = await apiPost(app, "/api/v1/auth/reset-password", {
        token: resetToken,
        newPassword: "AnotherPassword123!",
      });
      expect(replayRes.status).to.equal(400);

      // 4. Can login with new password
      const loginRes = await apiPost(app, "/api/v1/auth/login", {
        email: testEmail,
        password: newPassword,
      });
      expect(loginRes.status).to.equal(200);
    });
  });

  describe("3. Cryptographic Wallet Linking with Proof of Possession", function () {
    let donorToken;
    let linkingWallet;

    before(async function () {
      linkingWallet = ethers.Wallet.createRandom();
      const login = await apiPost(app, "/api/v1/auth/login", {
        email: testDonorUser.email,
        password: "BrandNewPassword2026!",
      });
      donorToken = login.body.data.token;
    });

    it("rejects wallet linking without cryptographic proof", async function () {
      const res = await apiPost(app, "/api/v1/auth/link-wallet", {
        address: linkingWallet.address,
        message: null,
        signature: null,
      }, { Authorization: `Bearer ${donorToken}` });

      expect(res.status).to.equal(400);
    });

    it("links wallet when valid ownership signature is proven", async function () {
      const message = `Link wallet ${linkingWallet.address} to TrustDonate account.`;
      const signature = await linkingWallet.signMessage(message);

      const res = await apiPost(app, "/api/v1/auth/link-wallet", {
        address: linkingWallet.address,
        message,
        signature,
      }, { Authorization: `Bearer ${donorToken}` });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.wallet_address.toLowerCase()).to.equal(linkingWallet.address.toLowerCase());
    });

    it("prevents linking a wallet already exclusively associated with another user", async function () {
      // Create a second donor
      const secondEmail = `second_${Date.now()}@example.com`;
      const reg = await apiPost(app, "/api/v1/auth/signup", {
        email: secondEmail,
        password: "Password987!",
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

      const secondLogin = await apiPost(app, "/api/v1/auth/login", {
        email: secondEmail,
        password: "Password987!",
      });
      const secondToken = secondLogin.body.data.token;

      // Second user tries to link linkingWallet (which is already bound to first donor)
      const message = `Link wallet ${linkingWallet.address} to TrustDonate account.`;
      const signature = await linkingWallet.signMessage(message);

      const res = await apiPost(app, "/api/v1/auth/link-wallet", {
        address: linkingWallet.address,
        message,
        signature,
      }, { Authorization: `Bearer ${secondToken}` });

      expect(res.status).to.equal(409);
      expect(res.body.error.code).to.equal("WALLET_ALREADY_LINKED");
    });
  });

  describe("4. Session Invalidation, Logout & Role Revocation", function () {
    let activeToken;
    let userId;

    before(async function () {
      const login = await apiPost(app, "/api/v1/auth/login", {
        email: testDonorUser.email,
        password: "BrandNewPassword2026!",
      });
      activeToken = login.body.data.token;
      userId = login.body.data.userId;
    });

    it("enforces session invalidation upon logout", async function () {
      // Verify token works
      const res1 = await apiGet(app, "/api/v1/auth/me", { Authorization: `Bearer ${activeToken}` });
      expect(res1.status).to.equal(200);

      // Perform logout
      const logoutRes = await apiPost(app, "/api/v1/auth/logout", {}, { Authorization: `Bearer ${activeToken}` });
      expect(logoutRes.status).to.equal(200);

      // Subsequent access with logged-out token is rejected
      const res2 = await apiGet(app, "/api/v1/auth/me", { Authorization: `Bearer ${activeToken}` });
      expect(res2.status).to.equal(401);
    });

    it("enforces immediate session invalidation when user token_version is incremented", async function () {
      // Login again to obtain a fresh token
      const login = await apiPost(app, "/api/v1/auth/login", {
        email: testDonorUser.email,
        password: "BrandNewPassword2026!",
      });
      const freshToken = login.body.data.token;

      const res1 = await apiGet(app, "/api/v1/auth/me", { Authorization: `Bearer ${freshToken}` });
      expect(res1.status).to.equal(200);

      // Revoke user sessions (e.g. administrator removes or revokes membership)
      authService.revokeUserSessions(userId);

      // Subsequent access is immediately rejected
      const res2 = await apiGet(app, "/api/v1/auth/me", { Authorization: `Bearer ${freshToken}` });
      expect(res2.status).to.equal(401);
    });
  });

  describe("5. NGO Registration, Conflict of Interest & Separate Verification Tracks", function () {
    let applicantWallet;
    let applicationId;
    const testRegNo = `REG-SEC-${Date.now()}`;

    before(function () {
      applicantWallet = ethers.Wallet.createRandom();
    });

    it("registers new NGO application in SUBMITTED state with separate verification tracks", async function () {
      const res = await apiPost(app, "/api/v1/onboarding/register", {
        legalName: "Secured Health Initiative",
        registrationNumber: testRegNo,
        category: "Healthcare",
        contactEmail: "contact@securedhealth.org",
        applicantWallet: applicantWallet.address,
        panNumber: "AAATH1234K",
        registeredAddress: "42 MG Road, Bengaluru",
        establishedYear: 2021,
        documents: {
          reg_certificate: { cid: "bafybeih4...1" },
          tax_80g: { cid: "bafybeih4...2" },
          bank_proof: { cid: "bafybeih4...3" },
          pan_card: { cid: "bafybeih4...4" },
        },
      });

      expect(res.status).to.equal(201);
      expect(res.body.data.status).to.equal("SUBMITTED");
      expect(res.body.data.verificationTracks.legalRegVerified).to.be.false;
      expect(res.body.data.verificationTracks.bankVerified).to.be.false;
      expect(res.body.data.verificationTracks.tax80gVerified).to.be.false;

      applicationId = res.body.data.id;
    });

    it("does not grant privileged NGO access prior to authorized review decision", async function () {
      const challenge = await apiPost(app, "/api/v1/auth/challenge", { address: applicantWallet.address });
      const sig = await applicantWallet.signMessage(challenge.body.data.message);
      const session = await apiPost(app, "/api/v1/auth/verify", { message: challenge.body.data.message, signature: sig });

      expect(session.body.data.globalRole).to.equal("DONOR");
      expect(session.body.data.role).to.equal("AUTHORIZED_DONOR");
      expect(session.body.data.memberships.length).to.equal(0);
    });

    it("enforces conflict of interest: applicant cannot review their own application", async function () {
      const applicantUser = db.prepare("SELECT * FROM users WHERE LOWER(wallet_address) = LOWER(?)").get(applicantWallet.address);
      const applicantToken = createTestToken(
        applicantUser ? applicantUser.id : "usr-superadmin",
        applicantWallet.address,
        "PLATFORM_SUPER_ADMIN",
        "PLATFORM_SUPER_ADMIN",
        null,
        getPermissionsForRoles(["PLATFORM_SUPER_ADMIN"])
      );

      const res = await apiPost(app, `/api/v1/admin/onboarding/${applicationId}/decision`, {
        decision: "APPROVED",
      }, { Authorization: `Bearer ${applicantToken}` });

      expect(res.status).to.equal(403); // Conflict of interest caught
      expect(res.body.error.message).to.include("Conflict of Interest");
    });

    it("allows independent Super Admin to record verification decision and provision NGO", async function () {
      const res = await apiPost(app, `/api/v1/admin/onboarding/${applicationId}/decision`, {
        decision: "APPROVED",
        verificationTracks: {
          legalRegVerified: true,
          bankVerified: true,
          tax80gVerified: true,
          fcraVerified: false,
        },
      }, { Authorization: `Bearer ${superAdminToken}` });

      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal("APPROVED");
      expect(res.body.data.verificationTracks.tax80gVerified).to.be.true;
    });
  });

  describe("6. Invitation Expiration and Single-Use Protection", function () {
    let inviteToken;

    it("creates a single-use invitation with 7-day expiration", async function () {
      const res = await apiPost(app, "/api/v1/ngos/ngo-1/invitations", {
        email: "invited.member@example.com",
        role: "FINANCE_OFFICER",
      }, { Authorization: `Bearer ${superAdminToken}` });

      expect(res.status).to.equal(201);
      expect(res.body.data.inviteToken).to.be.a("string");
      inviteToken = res.body.data.inviteToken;
    });

    it("rejects invitation when expired", async function () {
      // Backdate expiration
      db.prepare("UPDATE ngo_invitations SET expires_at = ? WHERE invite_token = ?").run(
        new Date(Date.now() - 1000).toISOString(),
        inviteToken
      );

      const res = await apiPost(app, "/api/v1/onboarding/invitations/accept", {
        inviteToken,
        walletAddress: ethers.Wallet.createRandom().address,
      });

      expect(res.status).to.equal(500);
      expect(res.body.error.message).to.include("expired");
    });
  });
});

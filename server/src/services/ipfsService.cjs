const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

class IpfsService {
  constructor() {
    this.storageDir = path.join(__dirname, "../../data/ipfs_cache");
    fs.mkdirSync(this.storageDir, { recursive: true });
  }

  /**
   * Deterministically calculates a content-addressed identifier (CID) from buffer content.
   */
  generateCid(contentBuffer) {
    const sha256Hash = crypto.createHash("sha256").update(contentBuffer).digest("hex");
    // Standard base58-like representation matching IPFS CID format
    const mockCid = "Qm" + sha256Hash.substring(0, 44);
    return { cid: mockCid, hash: sha256Hash };
  }

  /**
   * Pins document buffer to content-addressed storage.
   */
  async pinDocument(fileBuffer, originalName, mimeType) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Cannot pin empty file to IPFS");
    }

    if (fileBuffer.length > 10 * 1024 * 1024) {
      throw new Error("File exceeds maximum allowed size (10 MB)");
    }

    const { cid, hash } = this.generateCid(fileBuffer);
    const destinationPath = path.join(this.storageDir, `${cid}.bin`);
    fs.writeFileSync(destinationPath, fileBuffer);

    // Save metadata
    const metaPath = path.join(this.storageDir, `${cid}.meta.json`);
    const metadata = {
      cid,
      sha256: hash,
      originalName: originalName || "document.pdf",
      mimeType: mimeType || "application/octet-stream",
      sizeBytes: fileBuffer.length,
      pinnedAt: new Date().toISOString(),
    };
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

    return metadata;
  }

  /**
   * Resolves content and metadata by CID.
   */
  resolveCid(cid) {
    const metaPath = path.join(this.storageDir, `${cid}.meta.json`);
    if (!fs.existsSync(metaPath)) {
      return {
        cid,
        exists: false,
        gatewayUrl: `https://ipfs.io/ipfs/${cid}`,
      };
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    return {
      ...meta,
      exists: true,
      gatewayUrl: `https://ipfs.io/ipfs/${cid}`,
    };
  }
}

module.exports = new IpfsService();

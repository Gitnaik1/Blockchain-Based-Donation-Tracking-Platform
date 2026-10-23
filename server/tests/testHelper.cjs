const http = require("http");
const { Duplex } = require("stream");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "trustdonate_dev_secret_key_2026_xyz";

/**
 * Dispatches an HTTP request directly to an Express app without TCP network sockets.
 * Enables 100% sandboxed execution without network permissions.
 */
function callApp(app, { method = "GET", url = "/", headers = {}, body = null }) {
  return new Promise((resolve) => {
    let serialized = "";
    if (body !== null && body !== undefined) {
      serialized = typeof body === "string" ? body : JSON.stringify(body);
    }

    const reqHeaders = {
      ...headers,
      host: "localhost",
      "content-length": Buffer.byteLength(serialized),
    };

    if (body !== null && !reqHeaders["content-type"]) {
      reqHeaders["content-type"] = "application/json";
    }

    const socket = new Duplex({
      read() {},
      write(chunk, enc, cb) { cb(); },
    });
    socket.remoteAddress = "127.0.0.1";
    socket.encrypted = false;

    const req = new http.IncomingMessage(socket);
    req.method = method.toUpperCase();
    req.url = url;
    req.headers = Object.fromEntries(
      Object.entries(reqHeaders).map(([k, v]) => [k.toLowerCase(), v])
    );

    const res = new http.ServerResponse(req);
    res.assignSocket(socket);

    let resData = "";
    res.write = function (chunk) {
      if (chunk) resData += chunk.toString();
      return true;
    };

    res.end = function (chunk) {
      if (chunk) resData += chunk.toString();
      let parsed = resData;
      try {
        parsed = JSON.parse(resData);
      } catch {}
      resolve({
        status: res.statusCode,
        body: parsed,
        headers: res.getHeaders ? res.getHeaders() : {},
        rawText: resData,
      });
    };

    app(req, res);

    if (serialized) {
      req.push(serialized);
    }
    req.push(null);
  });
}

function createTestToken(userId, wallet, globalRole, activeRole, ngoId, permissions, tokenVersion = 1) {
  const payload = {
    userId,
    address: wallet,
    globalRole,
    activeRole,
    activeNgoId: ngoId,
    role: ["NGO_ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER"].includes(activeRole)
      ? "NGO_OPERATOR"
      : globalRole === "PLATFORM_SUPER_ADMIN"
      ? "PLATFORM_ADMIN"
      : "AUTHORIZED_DONOR",
    ngoId,
    permissions,
    tokenVersion,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

module.exports = {
  callApp,
  createTestToken,
  apiGet: (app, path, headers = {}) => callApp(app, { method: "GET", url: path, headers }),
  apiPost: (app, path, body = {}, headers = {}) => callApp(app, { method: "POST", url: path, headers, body }),
  apiPut: (app, path, body = {}, headers = {}) => callApp(app, { method: "PUT", url: path, headers, body }),
  apiPatch: (app, path, body = {}, headers = {}) => callApp(app, { method: "PATCH", url: path, headers, body }),
  apiDelete: (app, path, headers = {}) => callApp(app, { method: "DELETE", url: path, headers }),
};

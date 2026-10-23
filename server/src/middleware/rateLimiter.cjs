/**
 * High-performance In-Memory Rate Limiting Middleware
 * Protects auth challenges, disbursement proposals, and sensitive financial mutations.
 */
function createRateLimiter({ windowMs = 60 * 1000, maxRequests = 60, message = "Too many requests. Please slow down." }) {
  const requests = new Map();

  return (req, res, next) => {
    // In test environment, skip to prevent artificial test timeouts
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    const key = req.ip || req.connection.remoteAddress || "global";
    const now = Date.now();

    const record = requests.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + windowMs;
    } else {
      record.count += 1;
    }

    requests.set(key, record);

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message,
          retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
        },
      });
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
};

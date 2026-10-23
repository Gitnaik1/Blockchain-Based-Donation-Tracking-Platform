function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.url}:`, err.message);

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || "An unexpected error occurred",
      details: process.env.NODE_ENV === "development" ? err.stack : null,
    },
    timestamp: new Date().toISOString(),
  });
}

module.exports = errorHandler;

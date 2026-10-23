const db = require("../db/database.cjs");

class QueueService {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Registers a job processor for a named queue.
   */
  registerWorker(queueName, handler) {
    this.handlers.set(queueName, handler);
  }

  /**
   * Enqueues an idempotent background job.
   */
  enqueueJob({ queueName, payload, dedupKey = null, delayMs = 0, maxAttempts = 5 }) {
    const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const runAt = Date.now() + delayMs;

    // Check deduplication
    if (dedupKey) {
      const existing = db.prepare("SELECT * FROM background_jobs WHERE dedup_key = ?").get(dedupKey);
      if (existing) {
        return existing;
      }
    }

    db.prepare(`
      INSERT INTO background_jobs (id, queue_name, dedup_key, payload_json, status, attempts, max_attempts, run_at)
      VALUES (?, ?, ?, ?, 'PENDING', 0, ?, ?)
    `).run(jobId, queueName, dedupKey, JSON.stringify(payload), maxAttempts, runAt);

    return db.prepare("SELECT * FROM background_jobs WHERE id = ?").get(jobId);
  }

  /**
   * Executes next pending job with bounded exponential backoff and error tracking.
   */
  async processNextJob() {
    const job = db.prepare(`
      SELECT * FROM background_jobs
      WHERE status = 'PENDING' AND run_at <= ?
      ORDER BY run_at ASC LIMIT 1
    `).get(Date.now());

    if (!job) return null;

    const handler = this.handlers.get(job.queue_name);
    if (!handler) {
      db.prepare(`
        UPDATE background_jobs SET status = 'FAILED', last_error = 'No worker registered for queue'
        WHERE id = ?
      `).run(job.id);
      return job;
    }

    // Mark as PROCESSING
    db.prepare(`UPDATE background_jobs SET status = 'PROCESSING', attempts = attempts + 1 WHERE id = ?`).run(job.id);

    try {
      const payload = JSON.parse(job.payload_json);
      await handler(payload);

      db.prepare(`
        UPDATE background_jobs SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(job.id);

      return { id: job.id, status: "COMPLETED" };
    } catch (err) {
      const newAttempts = job.attempts + 1;
      if (newAttempts >= job.max_attempts) {
        db.prepare(`
          UPDATE background_jobs SET status = 'FAILED', last_error = ? WHERE id = ?
        `).run(err.message, job.id);
        return { id: job.id, status: "FAILED", error: err.message };
      } else {
        // Bounded exponential backoff: 2^attempts * 1000ms
        const backoffMs = Math.min(Math.pow(2, newAttempts) * 1000, 60000);
        const nextRunAt = Date.now() + backoffMs;

        db.prepare(`
          UPDATE background_jobs SET status = 'PENDING', run_at = ?, last_error = ? WHERE id = ?
        `).run(nextRunAt, err.message, job.id);

        return { id: job.id, status: "RETRY_SCHEDULED", nextRunAt };
      }
    }
  }

  getFailedJobs(limit = 20) {
    return db.prepare("SELECT * FROM background_jobs WHERE status = 'FAILED' ORDER BY created_at DESC LIMIT ?").all(limit);
  }
}

module.exports = new QueueService();

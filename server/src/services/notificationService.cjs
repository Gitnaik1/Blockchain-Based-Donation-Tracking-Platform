const db = require("../db/database.cjs");

class NotificationService {
  /**
   * Dispatches an in-app notification according to user preferences.
   */
  createNotification({ walletAddress, type, title, message, severity = "INFO", link = null }) {
    if (!walletAddress || !title || !message) {
      throw new Error("Missing parameters for notification dispatch.");
    }

    // Check user preferences
    const prefs = this.getPreferences(walletAddress);
    if (!prefs.in_app_enabled) {
      return null;
    }

    const notificationId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO notifications (id, wallet_address, type, title, message, severity, link, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(notificationId, walletAddress, type, title, message, severity, link);

    return db.prepare("SELECT * FROM notifications WHERE id = ?").get(notificationId);
  }

  /**
   * Broadcasts a notification to all members of an NGO matching a specific role (or all active members).
   */
  notifyNgoMembers({ ngoId, targetRole = null, type, title, message, severity = "INFO", link = null }) {
    let query = `
      SELECT u.wallet_address 
      FROM ngo_memberships m
      JOIN users u ON m.user_id = u.id
      WHERE m.ngo_id = ? AND m.status = 'ACTIVE'
    `;
    const params = [ngoId];

    if (targetRole) {
      query += " AND m.role = ?";
      params.push(targetRole);
    }

    const members = db.prepare(query).all(...params);
    const notifications = [];
    for (const member of members) {
      const notif = this.createNotification({
        walletAddress: member.wallet_address,
        type,
        title,
        message,
        severity,
        link,
      });
      if (notif) notifications.push(notif);
    }
    return notifications;
  }

  getUserNotifications(walletAddress, { unreadOnly = false, limit = 50 } = {}) {
    let query = "SELECT * FROM notifications WHERE LOWER(wallet_address) = LOWER(?)";
    const params = [walletAddress];

    if (unreadOnly) {
      query += " AND is_read = 0";
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    return db.prepare(query).all(...params);
  }

  markAsRead(notificationId, walletAddress) {
    db.prepare(`
      UPDATE notifications SET is_read = 1 WHERE id = ? AND LOWER(wallet_address) = LOWER(?)
    `).run(notificationId, walletAddress);
    return true;
  }

  markAllAsRead(walletAddress) {
    db.prepare(`
      UPDATE notifications SET is_read = 1 WHERE LOWER(wallet_address) = LOWER(?)
    `).run(walletAddress);
    return true;
  }

  getPreferences(walletAddress) {
    let prefs = db.prepare("SELECT * FROM notification_preferences WHERE LOWER(wallet_address) = LOWER(?)").get(walletAddress);
    if (!prefs) {
      prefs = {
        wallet_address: walletAddress,
        email: null,
        email_enabled: 0,
        in_app_enabled: 1,
        min_severity: "INFO",
        categories_json: '["ALL"]',
      };
    }
    return {
      ...prefs,
      categories: JSON.parse(prefs.categories_json || '["ALL"]'),
    };
  }

  updatePreferences(walletAddress, { email, emailEnabled, inAppEnabled, minSeverity, categories }) {
    const existing = this.getPreferences(walletAddress);
    const updatedEmail = email !== undefined ? email : existing.email;
    const updatedEmailEnabled = emailEnabled !== undefined ? (emailEnabled ? 1 : 0) : existing.email_enabled;
    const updatedInAppEnabled = inAppEnabled !== undefined ? (inAppEnabled ? 1 : 0) : existing.in_app_enabled;
    const updatedMinSeverity = minSeverity || existing.min_severity;
    const updatedCategories = categories ? JSON.stringify(categories) : existing.categories_json;

    db.prepare(`
      INSERT INTO notification_preferences (wallet_address, email, email_enabled, in_app_enabled, min_severity, categories_json)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(wallet_address) DO UPDATE SET
        email = excluded.email,
        email_enabled = excluded.email_enabled,
        in_app_enabled = excluded.in_app_enabled,
        min_severity = excluded.min_severity,
        categories_json = excluded.categories_json,
        updated_at = CURRENT_TIMESTAMP
    `).run(walletAddress, updatedEmail, updatedEmailEnabled, updatedInAppEnabled, updatedMinSeverity, updatedCategories);

    return this.getPreferences(walletAddress);
  }

  /**
   * Non-custodial recurring donation reminder scheduler.
   * Alerts donor at scheduled interval to sign their periodic contribution with their own wallet.
   * Strictly avoids holding or requesting donor private keys.
   */
  scheduleRecurringReminder({ donorWallet, ngoId, amountFormatted, intervalDays = 30 }) {
    return this.createNotification({
      walletAddress: donorWallet,
      type: "RECURRING_DONATION_REMINDER",
      title: "Scheduled Contribution Reminder",
      message: `Your non-custodial recurring support of ${amountFormatted} to your selected NGO is due. Connect your wallet to sign and confirm the contribution.`,
      severity: "INFO",
      link: `/ngo/${ngoId}`,
    });
  }
}

module.exports = new NotificationService();

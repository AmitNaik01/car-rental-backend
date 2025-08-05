const db = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.execute(
      `SELECT id, title, message, type, is_read, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, notifications: rows });
  } catch (error) {
    console.error("❌ Notification fetch error:", error);
    res.status(500).json({ success: false, message: "Error fetching notifications" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    await db.execute(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("❌ Mark as read error:", error);
    res.status(500).json({ success: false, message: "Error updating notification" });
  }
};

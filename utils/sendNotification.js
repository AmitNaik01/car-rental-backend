const db = require('../config/db');

const sendNotification = async (userId, title, message, type = 'alert') => {
  await db.execute(
    `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
    [userId, title, message, type]
  );
};

module.exports = sendNotification;

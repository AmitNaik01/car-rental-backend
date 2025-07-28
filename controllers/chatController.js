const db = require('../config/db');

// Send a chat message
const sendChatMessage = async (req, res) => {
  try {
    const { booking_id, message } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role; // 'user' or 'admin'

    // Validate input
    if (!booking_id || !message) {
      return res.status(400).json({ success: false, message: 'Booking ID and message are required' });
    }

    // Get booking and admin_id (car owner)
    const [[booking]] = await db.execute(
      `SELECT b.user_id, c.created_by AS admin_id
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       WHERE b.id = ?`,
      [booking_id]
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const user_id = booking.user_id;
    const admin_id = booking.admin_id;

    await db.execute(
      `INSERT INTO chat_messages (booking_id, user_id, admin_id, sender_role, message)
       VALUES (?, ?, ?, ?, ?)`,
      [booking_id, user_id, admin_id, senderRole, message]
    );

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('❌ Send Chat Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// Get chat history for a booking
const getChatHistory = async (req, res) => {
  try {
    const booking_id = req.params.booking_id;

    const [messages] = await db.execute(
      `SELECT sender_role, message, created_at
       FROM chat_messages
       WHERE booking_id = ?
       ORDER BY created_at ASC`,
      [booking_id]
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error('❌ Chat History Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
};

const getAdminConversations = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [rows] = await db.execute(`
      SELECT 
        cm.booking_id,
        u.id AS user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        CONCAT(c.make, ' ', c.model) AS car_name,
        ci.front_image AS car_image,
        cm.message AS last_message,
        cm.created_at AS last_time
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      JOIN bookings b ON cm.booking_id = b.id
      JOIN cars c ON b.car_id = c.id
      LEFT JOIN car_images ci ON ci.car_id = c.id
      WHERE cm.admin_id = ?
        AND cm.created_at = (
          SELECT MAX(created_at)
          FROM chat_messages
          WHERE booking_id = cm.booking_id
        )
      GROUP BY cm.booking_id
      ORDER BY cm.created_at DESC
    `, [adminId]);

    const baseUrl = 'https://indianradio.in/car-rental/uploads/cars/';

    const conversations = rows.map(row => ({
      user_id: row.user_id,
      user_name: row.user_name,
      booking_id: row.booking_id,
      car_name: row.car_name,
      car_image: row.car_image ? baseUrl + row.car_image : null,
      last_message: row.last_message,
      last_time: row.last_time
    }));

    res.json({ success: true, conversations });
  } catch (error) {
    console.error("❌ Admin Chat List Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
};


module.exports = {
    getAdminConversations,
  sendChatMessage,
  getChatHistory
};

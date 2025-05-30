const db = require('../config/db'); // Pooled connection from mysql2/promise

// Create a new user
const createUser = async (name, email, hashedPassword, role) => {
  const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
  const [result] = await db.execute(sql, [name, email, hashedPassword, role]);
  return result;
};

// Create user with email verification code
const createUserWithVerification = async (name, email, hashedPassword, role, code) => {
  const sql = `
    INSERT INTO users (name, email, password, role, verification_code, verification_expiry)
    VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`;
  const [result] = await db.execute(sql, [name, email, hashedPassword, role, code]);
  return result;
};

// Find user by email
const findUserByEmail = async (email) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const [rows] = await db.execute(sql, [email]);
  return rows[0];
};

// Find user by email and verification code
const findByVerificationCode = async (email, code) => {
  const sql = 'SELECT * FROM users WHERE email = ? AND verification_code = ? AND verification_expiry > NOW()';
  const [rows] = await db.execute(sql, [email, code]);
  return rows[0];
};

// Mark user as verified
const verifyUserEmail = async (userId) => {
  const sql = 'UPDATE users SET is_verified = 1 WHERE id = ?';
  const [result] = await db.execute(sql, [userId]);
  return result;
};

// Set reset code and expiry
const setResetCode = async (email, code) => {
  const sql = `
    UPDATE users
    SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 1 HOUR)
    WHERE email = ?`;
  const [result] = await db.execute(sql, [code, email]);
  return result;
};

// Find user by reset code
const findByResetCode = async (code) => {
  const sql = 'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()';
  const [rows] = await db.execute(sql, [code]);
  return rows[0];
};

// Update password and clear reset code
const updatePassword = async (userId, newHashedPassword) => {
  const sql = `
    UPDATE users
    SET password = ?, reset_token = NULL, reset_token_expiry = NULL
    WHERE id = ?`;
  const [result] = await db.execute(sql, [newHashedPassword, userId]);
  return result;
};

module.exports = {
  createUser,
  createUserWithVerification,
  findUserByEmail,
  findByVerificationCode,
  verifyUserEmail,
  setResetCode,
  findByResetCode,
  updatePassword
};

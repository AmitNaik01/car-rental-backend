const db = require('../config/db');

// Create new user
const createUser = (name, email, hashedPassword, role, callback) => {
  const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, hashedPassword, role], callback);
};

// Find user by email and verification code
const findByVerificationCode = (email, code, callback) => {
  const sql = 'SELECT * FROM users WHERE email = ? AND verification_code = ?';
  db.query(sql, [email, code], (err, result) => {
    if (err) return callback(err);
    callback(null, result[0]);
  });
};

const verifyUserEmail = (userId, callback) => {
  const sql = 'UPDATE users SET is_verified = 1 WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
};

const createUserWithVerification = (name, email, hashedPassword, role, code, callback) => {
  const sql = `
    INSERT INTO users (name, email, password, role, verification_code, verification_expiry)
    VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`;
  db.query(sql, [name, email, hashedPassword, role, code], callback);
};

// Find user by email
const findUserByEmail = (email, callback) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

// ✅ Update reset code and expiry
const setResetCode = (email, code, callback) => {
  const sql = `UPDATE users SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?`;
  db.query(sql, [code, email], callback);
};

// ✅ Find user by reset code
const findByResetCode = (code, callback) => {
  const sql = `SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()`;
  db.query(sql, [code], (err, results) => {
    callback(err, results[0]);
  });
};

// Update password after validating reset code
const updatePassword = (userId, newHashedPassword, callback) => {
  const sql = `UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`;
  db.query(sql, [newHashedPassword, userId], callback);
};


module.exports = {
  createUser,
  createUserWithVerification,
  verifyUserEmail,
  findByVerificationCode,
  findUserByEmail,
  setResetCode,
  findByResetCode,
  updatePassword
};

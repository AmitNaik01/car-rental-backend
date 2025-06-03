const db = require('../config/db'); // Pooled connection from mysql2/promise

// 👉 Create user with email verification code
const createUserWithVerification = async (first_name, last_name, email, hashedPassword, dob, role, code) => {
  const sql = `
    INSERT INTO users (
      first_name, last_name, email, password, dob, role, verification_code, verification_expiry, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW())`;
  
  const [result] = await db.execute(sql, [
    first_name,
    last_name,
    email,
    hashedPassword,
    dob,
    role,
    code
  ]);

  return result;
};

// 👉 Create basic user (without verification, if needed)
const createUser = async (name, email, hashedPassword, role) => {
  const sql = `
    INSERT INTO users (name, email, password, role, created_at)
    VALUES (?, ?, ?, ?, NOW())`;

  const [result] = await db.execute(sql, [name, email, hashedPassword, role]);

  return result;
};

// 👉 Find user by email
const findUserByEmail = async (email) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const [rows] = await db.execute(sql, [email]);
  return rows[0];
};

// 👉 Find user by email and verification code
const findByVerificationCode = async (email, code) => {
  const sql = `
    SELECT * FROM users 
    WHERE email = ? AND verification_code = ? AND verification_expiry > NOW()`;

  const [rows] = await db.execute(sql, [email, code]);
  return rows[0];
};

// 👉 Mark user as verified
const verifyUserEmail = async (userId) => {
  const sql = 'UPDATE users SET is_verified = 1 WHERE id = ?';
  const [result] = await db.execute(sql, [userId]);
  return result;
};

// 👉 Set password reset code and expiry
const setResetCode = async (email, code) => {
  const sql = `
    UPDATE users
    SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 1 HOUR)
    WHERE email = ?`;

  const [result] = await db.execute(sql, [code, email]);
  return result;
};

// 👉 Find user by reset token
const findByResetCode = async (code) => {
  const sql = `
    SELECT * FROM users 
    WHERE reset_token = ? AND reset_token_expiry > NOW()`;

  const [rows] = await db.execute(sql, [code]);
  return rows[0];
};

// 👉 Update password and clear reset token
const updatePassword = async (userId, newHashedPassword) => {
  const sql = `
    UPDATE users
    SET password = ?, reset_token = NULL, reset_token_expiry = NULL
    WHERE id = ?`;

  const [result] = await db.execute(sql, [newHashedPassword, userId]);
  return result;
};

// 👉 Update last login time
const updateLastLogin = async (userId) => {
  const sql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
  const [result] = await db.execute(sql, [userId]);
  return result;
};

// 👉 Update verification code and expiry
const updateVerificationCode = async (email, code) => {
  const sql = `
    UPDATE users
    SET verification_code = ?, verification_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
    WHERE email = ?
  `;
  const [result] = await db.execute(sql, [code, email]);
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
  updatePassword,
  updateLastLogin,
  updateVerificationCode
};

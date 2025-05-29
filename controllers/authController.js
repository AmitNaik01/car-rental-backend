const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { sendResetCode } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET;

// 👉 Signup Controller
const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  userModel.findUserByEmail(email, async (err, existingUser) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (existingUser) return res.status(409).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    userModel.createUserWithVerification(name, email, hashedPassword, role || 'user', code, (err, result) => {
      if (err) return res.status(500).json({ message: 'User creation failed' });

      sendResetCode(email, code); // reuse your mail function

      res.status(201).json({ message: 'Verification code sent to email. Please verify.' });
    });
  });
};

// 👉 Login Controller
const login = (req, res) => {
  const { email, password } = req.body;

  userModel.findUserByEmail(email, async (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
     // ✅ Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    const roleMsg = user.role === 'admin' ? 'Admin' : 'User';

    res.status(200).json({
      message: `${roleMsg} login successful`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
};

// 👉 Forgot Password (Send Code)
const forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  userModel.findUserByEmail(email, (err, user) => {
    if (err || !user) return res.status(404).json({ message: 'User not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

    userModel.setResetCode(email, code, async (err) => {
      if (err) return res.status(500).json({ message: 'Error saving reset code' });

      try {
        await sendResetCode(email, code);
        res.status(200).json({ message: 'Reset code sent to email' });
      } catch (e) {
        console.error('❌ Email send error:', e);
        res.status(500).json({ message: 'Email sending failed' });
      }
    });
  });
};

// 👉 Reset Password With Code
const resetPassword = async (req, res) => {
  const { code, newPassword } = req.body;

  if (!code || !newPassword) {
    return res.status(400).json({ message: 'Code and new password are required' });
  }

  userModel.findByResetCode(code, async (err, user) => {
    if (err || !user) return res.status(400).json({ message: 'Invalid or expired code' });

    const hashed = await bcrypt.hash(newPassword, 10);
    userModel.updatePassword(user.id, hashed, (err) => {
      if (err) return res.status(500).json({ message: 'Password update failed' });

      res.status(200).json({ message: 'Password reset successful' });
    });
  });
};

// 👉 Verify Email Controller
const verifyEmail = (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  userModel.findByVerificationCode(email, code, (err, user) => {
    if (err || !user) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    userModel.verifyUserEmail(user.id, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Verification failed' });
      }

      return res.status(200).json({ message: 'Email verified successfully' });
    });
  });
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail
};

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { sendResetCode } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET;

// 👉 Signup
const signup = async (req, res) => {
  const { first_name, last_name, email, password, dob, role = 'user' } = req.body;

  if (!first_name || !last_name || !email || !password || !dob) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await userModel.findUserByEmail(email);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Convert DOB from DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = dob.split('/');
    const formattedDob = `${year}-${month}-${day}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      if (existingUser.is_verified) {
        return res.status(409).json({ message: 'Email already registered and verified' });
      } else {
        // Update code & expiry for already registered but unverified user
        await userModel.updateVerificationCode(email, code);
        await sendResetCode(email, code);
        return res.status(200).json({ message: 'Verification code re-sent to your email. Please verify.' });
      }
    }

    // Create new user with verification code
    await userModel.createUserWithVerification(
      first_name,
      last_name,
      email,
      hashedPassword,
      formattedDob,
      role,
      code
    );

    await sendResetCode(email, code);

    res.status(201).json({ message: 'Verification code sent to email. Please verify.' });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
};




// 👉 Login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: `${user.role === 'admin' ? 'Admin' : 'User'} login successful`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
};


// 👉 Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await userModel.setResetCode(email, code);
    await sendResetCode(email, code);

    res.status(200).json({ message: 'Reset code sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// 👉 Reset Password
const resetPassword = async (req, res) => {
  const { code, newPassword } = req.body;

  if (!code || !newPassword) {
    return res.status(400).json({ message: 'Code and new password are required' });
  }

  try {
    const user = await userModel.findByResetCode(code);
    if (!user) return res.status(400).json({ message: 'Invalid or expired code' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(user.id, hashed);

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Password reset failed' });
  }
};

// 👉 Verify Email
const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  try {
    const user = await userModel.findByVerificationCode(email, code);
    if (!user) return res.status(400).json({ message: 'Invalid or expired code' });

    await userModel.verifyUserEmail(user.id);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification failed' });
  }
};

const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await userModel.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Use model to update
    await userModel.updateVerificationCode(email, code);

    // Send email
    await sendResetCode(email, code);

    res.status(200).json({ message: 'Verification code is sent to your email' });
  } catch (err) {
    console.error('Resend Verification Error:', err);
    res.status(500).json({ message: 'Failed to resend verification code', error: err.message });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationCode
};

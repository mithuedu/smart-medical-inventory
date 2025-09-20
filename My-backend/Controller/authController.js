// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../Model/userModel");
const otpModel = require("../Model/otpModel");
const { sendOtpEmail } = require("../services/mailService");

function generate6DigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // string '123456'
}

const register = async (req, res) => {
  try {
    const { username, name, PhoneNumber, EmailID, address, password } = req.body;
    if (!username || !name || !PhoneNumber || !EmailID || !address || !password) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }

    const phoneNumber = PhoneNumber.trim();
    const email = EmailID.trim().toLowerCase();

    // duplicate checks
    if (await userModel.findUserByEmail(email)) {
      return res.status(200).json({ success: false, error: "Email already in use." });
    }
    if (await userModel.findUserByPhone(phoneNumber)) {
      return res.status(200).json({ success: false, error: "Phone number already in use." });
    }
    if (await userModel.findUserByUsername(username)) {
      return res.status(200).json({ success: false, error: "Username already taken." });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // create user
    const newUser = await userModel.createUser({
      username: username.trim(),
      name: name.trim(),
      phoneNumber,
      email,
      address: address.trim(),
      passwordHash,
    });

    // create OTP
    const otpCode = generate6DigitOtp();
    const otpRecord = await otpModel.createOtp(email, otpCode, 10); // expires in 10 minutes

    // send OTP email (fire-and-forget-ish but await to surface errors)
    try {
      await sendOtpEmail({ to: email, otp: otpCode });
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr);
      // You may choose to delete the user or OTP on mail failure. For now, inform client.
      return res.status(500).json({
        success: false,
        error: "Failed to send verification email. Please try again later.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "User created. OTP sent to email for verification.",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        is_verified: newUser.is_verified,
      },
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email: rawEmail, otp } = req.body;
    if (!rawEmail || !otp) {
      return res.status(400).json({ success: false, error: "Email and OTP are required." });
    }
    const email = rawEmail.trim().toLowerCase();

    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    if (user.is_verified) {
      return res.status(400).json({ success: false, error: "User already verified." });
    }

    const otpRecord = await otpModel.findValidOtp(email, otp);
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: "Invalid or used OTP." });
    }

    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    if (expiresAt < now) {
      return res.status(400).json({ success: false, error: "OTP expired." });
    }

    // mark otp used
    await otpModel.markOtpUsed(otpRecord.id);

    // mark user verified
    const verifiedUser = await userModel.markUserVerifiedByEmail(email);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      user: verifiedUser,
    });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
};

const login = async (req, res) => {
  try {
    const { EmailID, password,role} = req.body;
    if (!password || (!EmailID && !username && !PhoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Provide password and one of EmailID, username or PhoneNumber.",
      });
    }

    let user = null;
    if (EmailID) {
      const email = EmailID.trim()
      user = await userModel.findUserByEmail(email);
    } 
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }
    console.log(user)
    // optionally require email verification
    if (!user.is_verified) {
      console.log(user)
      return res.status(403).json({
        success: false,
        error: "Email not verified. Please verify your email before logging in.",
      });
    }

    // sign JWT
    const jwtSecret = process.env.JWT_SECRET || "replace_this_with_real_secret";
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "7d" });
    
    const safeUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phoneNumber: user.phone_number,
      address: user.address,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      role:user.role
    };

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: safeUser,
      token,
      
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { EmailID } = req.body;
    if (!EmailID) {
      return res.status(400).json({ success: false, error: "Email required." });
    }
    const email = EmailID.trim().toLowerCase();

    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    const otpCode = generate6DigitOtp();
    await otpModel.createOtp(email, otpCode, 10); // 10 min expiry

    try {
      await sendOtpEmail({ to: email, otp: otpCode });
    } catch (err) {
      console.error("Failed to send reset email:", err);
      return res.status(500).json({ success: false, error: "Failed to send reset email." });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to email for password reset.",
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { EmailID, OTP, newpassword } = req.body;
    if (!EmailID || !OTP || !newpassword) {
      return res.status(400).json({ success: false, error: "Email, OTP and new password are required." });
    }
    const email = EmailID.trim().toLowerCase();

    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    const otpRecord = await otpModel.findValidOtp(email, OTP);
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: "Invalid or expired OTP." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newpassword, salt);

    await userModel.updatePasswordByEmail(email, passwordHash);

    await otpModel.markOtpUsed(otpRecord.id);

    return res.status(200).json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
};


module.exports = {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword
};


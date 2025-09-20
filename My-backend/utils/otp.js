/**
 * Generate a numeric OTP of given length
 * @param {number} length - number of digits (default: 6)
 * @returns {string} OTP code (e.g. "483920")
 */
const generateOtp = (length = 6) => {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10); // append a digit 0–9
  }
  return otp;
};

module.exports = { generateOtp };

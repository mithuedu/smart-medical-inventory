// models/otpModel.js
const pool = require("../Config/db");

const queries = {
  createOtp: `INSERT INTO public.otps (email, otp_code, used, created_at, expires_at)
              VALUES ($1, $2, false, now(), now() + interval '10 minutes')
              RETURNING id, email, otp_code, used, created_at, expires_at`,
  findValidOtp: `SELECT id, email, otp_code, used, created_at, expires_at
                 FROM public.otps
                 WHERE email = $1 AND otp_code = $2 AND used = false
                 ORDER BY created_at DESC
                 LIMIT 1`,
  markUsedById: `UPDATE public.otps SET used = true WHERE id = $1 RETURNING id, email, otp_code, used, created_at, expires_at`
};

async function createOtp(email, otpCode, ttlMinutes = 10) {
  const { rows } = await pool.query(
    `INSERT INTO public.otps (email, otp_code, used, created_at, expires_at)
     VALUES ($1, $2, false, now(), now() + ($3 || ' minutes')::interval)
     RETURNING id, email, otp_code, used, created_at, expires_at`,
     [email, otpCode, ttlMinutes]
  );
  return rows[0];
}

async function findValidOtp(email, otpCode) {
  const { rows } = await pool.query(queries.findValidOtp, [email, otpCode]);
  return rows[0] || null;
}

async function markOtpUsed(id) {
  const { rows } = await pool.query(queries.markUsedById, [id]);
  return rows[0] || null;
}

module.exports = {
  createOtp,
  findValidOtp,
  markOtpUsed,
};

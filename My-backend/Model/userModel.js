// models/userModel.js
const pool = require("../Config/db"); // adjust path to your pool
const queries = {
  findByEmail: `SELECT id, username, name, phone_number, email, address, password_hash, created_at, updated_at, is_verified,role
                FROM public.users WHERE email = $1 LIMIT 1`,
  findByPhone: `SELECT id, username, name, phone_number, email, address, password_hash, created_at, updated_at, is_verified,role
                FROM public.users WHERE phone_number = $1 LIMIT 1`,
  findByUsername: `SELECT id, username, name, phone_number, email, address, password_hash, created_at, updated_at, is_verified,role
                   FROM public.users WHERE username = $1 LIMIT 1`,
  createUser: `INSERT INTO public.users (username, name, phone_number, email, address, password_hash, is_verified)
               VALUES ($1,$2,$3,$4,$5,$6,false)
               RETURNING id, username, name, phone_number, email, address, created_at, updated_at, is_verified`
};

async function findUserByEmail(email) {
  const { rows } = await pool.query(queries.findByEmail, [email]);
  return rows[0] || null;
}

async function findUserByPhone(phone) {
  const { rows } = await pool.query(queries.findByPhone, [phone]);
  return rows[0] || null;
}

async function findUserByUsername(username) {
  const { rows } = await pool.query(queries.findByUsername, [username]);
  return rows[0] || null;
}

async function createUser({ username, name, phoneNumber, email, address, passwordHash }) {
  const { rows } = await pool.query(queries.createUser, [
    username,
    name,
    phoneNumber,
    email,
    address,
    passwordHash,
  ]);
  return rows[0];
}

async function markUserVerifiedByEmail(email) {
  const { rows } = await pool.query(
    `UPDATE public.users SET is_verified = true, updated_at = now() WHERE email = $1 RETURNING id, username, name, phone_number, email, address, created_at, updated_at, is_verified`,
    [email]
  );
  return rows[0] || null;
}

async function updatePasswordByEmail(email, passwordHash) {
  const { rows } = await pool.query(
    `UPDATE public.users SET password_hash = $2, updated_at = now() WHERE email = $1 RETURNING id, email`,
    [email, passwordHash]
  );
  return rows[0] || null;
}



module.exports = {
  findUserByEmail,
  findUserByPhone,
  findUserByUsername,
  createUser,
  markUserVerifiedByEmail,
  updatePasswordByEmail
};

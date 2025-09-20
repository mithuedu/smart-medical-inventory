require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../Config/db');

const createAdmin = async () => {
    try {
        console.log('🔧 Creating admin user...');
        console.log('🌐 Using database:', process.env.DATABASE_URL ? 'Remote Database' : 'Local Database');

        // Test connection
        await pool.query('SELECT 1');
        console.log('✅ Database connected');

        // Check if admin exists
        const existing = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@medical.com']);

        if (existing.rows.length > 0) {
            console.log('✅ Admin already exists');
            console.log('📧 Email: admin@medical.com');
            console.log('🔑 Password: Admin@123');
            console.log('🛡️  Role:', existing.rows[0].role);
            return;
        }

        // Create admin
        const passwordHash = await bcrypt.hash('Admin@123', 12);

        await pool.query(`
            INSERT INTO users (username, name, phone_number, email, address, password_hash, role, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            'admin',
            'System Administrator',
            '+1234567890',
            'admin@medical.com',
            'System Office',
            passwordHash,
            'admin',
            true
        ]);

        console.log('✅ Admin created successfully!');
        console.log('📧 Email: admin@medical.com');
        console.log('🔑 Password: Admin@123');
        console.log('🛡️  Role: admin');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === '42P01') {
            console.log('💡 Users table not found. Make sure your main database is set up.');
        }
    } finally {
        await pool.end();
        process.exit();
    }
};

createAdmin();
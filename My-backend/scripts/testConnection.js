require('dotenv').config();
const pool = require('../Config/db');

const testConnection = async () => {
    try {
        console.log('🔍 Testing database connection...');
        console.log('🌐 DATABASE_URL present:', !!process.env.DATABASE_URL);

        if (process.env.DATABASE_URL) {
            console.log('🔗 Using remote database connection');
        } else {
            console.log('🏠 Using local database connection');
        }

        const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
        console.log('✅ Connection successful!');
        console.log('⏰ Database time:', result.rows[0].current_time);
        console.log('📊 PostgreSQL version:', result.rows[0].db_version.split(' ')[0] + ' ' + result.rows[0].db_version.split(' ')[1]);

        // Test if we can create a simple table
        await pool.query('CREATE TABLE IF NOT EXISTS connection_test (id SERIAL PRIMARY KEY, test_time TIMESTAMP DEFAULT NOW())');
        await pool.query('INSERT INTO connection_test DEFAULT VALUES');
        const testResult = await pool.query('SELECT COUNT(*) as count FROM connection_test');
        console.log('📝 Test table records:', testResult.rows[0].count);

        // Clean up
        await pool.query('DROP TABLE IF EXISTS connection_test');
        console.log('🧹 Cleaned up test table');

        console.log('\n🎉 Database connection test passed!');

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Check if DATABASE_URL is correct in .env');
        console.log('   2. Verify database server is accessible');
        console.log('   3. Check firewall and network settings');
    } finally {
        await pool.end();
        process.exit();
    }
};

testConnection();
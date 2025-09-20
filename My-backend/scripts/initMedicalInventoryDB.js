require('dotenv').config(); // Load environment variables first
const pool = require('../Config/db');
const fs = require('fs');
const path = require('path');

const initializeDatabase = async () => {
    try {
        console.log('🏥 Initializing Medical Inventory Database...');

        // Read the SQL schema file
        const schemaPath = path.join(__dirname, 'medical_inventory_schema.sql');
        const sqlSchema = fs.readFileSync(schemaPath, 'utf8');

        // Execute the schema
        await pool.query(sqlSchema);

        console.log('✅ Database schema created successfully!');

        // Verify tables
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('categories', 'suppliers', 'medical_items', 'inventory_stock', 'stock_movements', 'inventory_alerts')
            ORDER BY table_name
        `);

        console.log('📋 Created Tables:');
        tables.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));

        // Get sample data counts
        const counts = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM categories'),
            pool.query('SELECT COUNT(*) as count FROM suppliers'),
            pool.query('SELECT COUNT(*) as count FROM medical_items'),
            pool.query('SELECT COUNT(*) as count FROM inventory_stock')
        ]);

        console.log('\n📊 Sample Data:');
        console.log(`   📂 Categories: ${counts[0].rows[0].count}`);
        console.log(`   🏭 Suppliers: ${counts[1].rows[0].count}`);
        console.log(`   💊 Medical Items: ${counts[2].rows[0].count}`);
        console.log(`   📦 Stock Records: ${counts[3].rows[0].count}`);

        console.log('\n🎉 Medical Inventory Database is ready!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        process.exit();
    }
};

initializeDatabase();
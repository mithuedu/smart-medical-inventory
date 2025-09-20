require('dotenv').config();
const pool = require('../Config/db');

const testDatabase = async () => {
    try {
        console.log('🔍 Testing Medical Inventory Database...');
        console.log('🌐 Database:', process.env.DATABASE_URL ? 'Remote Database' : 'Local Database');

        // Test connection
        const time = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Connected at:', time.rows[0].current_time);

        // Test if tables exist
        const tablesExist = await pool.query(`
            SELECT COUNT(*) as table_count
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('categories', 'suppliers', 'medical_items', 'inventory_stock')
        `);

        console.log(`📋 Inventory tables found: ${tablesExist.rows[0].table_count}/4`);

        if (tablesExist.rows[0].table_count === '0') {
            console.log('⚠️  No inventory tables found. Run: npm run init-inventory');
            return;
        }

        // Test queries
        const items = await pool.query(`
            SELECT mi.name, c.name as category, ist.quantity_available
            FROM medical_items mi
                     LEFT JOIN categories c ON mi.category_id = c.id
                     LEFT JOIN inventory_stock ist ON mi.id = ist.item_id
                LIMIT 5
        `);

        console.log('\n📋 Sample Items:');
        items.rows.forEach(item => {
            console.log(`   💊 ${item.name} (${item.category}) - Stock: ${item.quantity_available || 0}`);
        });

        console.log('\n✅ Database test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await pool.end();
        process.exit();
    }
};

testDatabase();
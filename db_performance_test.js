const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// Config
const TEST_ITERATIONS = 20;
const LOG_FILE = 'db_results_log.txt';
const TEST_DATA = {
    textHash: 'test_hash_' + Date.now(),
    category: 'test_category',
    summary: 'This is a test summary for performance testing',
    url: 'http://test.com'
};

// Utility
function log(message) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
}

async function measureTime(operation) {
    const start = process.hrtime();
    await operation();
    const [seconds, nanoseconds] = process.hrtime(start);
    return seconds * 1000 + nanoseconds / 1000000; // ms
}

async function runPerformanceTest() {
    fs.writeFileSync(LOG_FILE, '📊 DATABASE PERFORMANCE TEST RESULTS\n\n');
    log('🚀 Starting performance test...');

    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        // Test 1: Connection Time
        log('\n🔌 Test 1: Connection Time');
        const connectionTimes = [];
        for (let i = 0; i < TEST_ITERATIONS; i++) {
            const time = await measureTime(async () => {
                const conn = await pool.getConnection();
                conn.release();
            });
            connectionTimes.push(time);
            log(`  ↳ Iteration ${i + 1}: ${time.toFixed(2)}ms`);
        }
        const avgConnectionTime = connectionTimes.reduce((a, b) => a + b) / TEST_ITERATIONS;
        log(`  📈 Average: ${avgConnectionTime.toFixed(2)}ms`);

        // Test 2: Insert Performance
        log('\n✍️ Test 2: Insert Performance');
        const insertTimes = [];
        for (let i = 0; i < TEST_ITERATIONS; i++) {
            const time = await measureTime(async () => {
                await pool.query(
                    'INSERT INTO summaries (text_hash, summary_text, category, url) VALUES (?, ?, ?, ?)',
                    [TEST_DATA.textHash + i, TEST_DATA.summary, TEST_DATA.category, TEST_DATA.url]
                );
            });
            insertTimes.push(time);
            log(`  ↳ Insert ${i + 1}: ${time.toFixed(2)}ms`);
        }
        const avgInsertTime = insertTimes.reduce((a, b) => a + b) / TEST_ITERATIONS;
        log(`  📈 Average: ${avgInsertTime.toFixed(2)}ms`);

        // Test 3: Select Performance
        log('\n🔎 Test 3: Select Performance');
        const selectTimes = [];
        for (let i = 0; i < TEST_ITERATIONS; i++) {
            const time = await measureTime(async () => {
                await pool.query(
                    'SELECT summary_text FROM summaries WHERE text_hash = ? AND category = ?',
                    [TEST_DATA.textHash + i, TEST_DATA.category]
                );
            });
            selectTimes.push(time);
            log(`  ↳ Select ${i + 1}: ${time.toFixed(2)}ms`);
        }
        const avgSelectTime = selectTimes.reduce((a, b) => a + b) / TEST_ITERATIONS;
        log(`  📈 Average: ${avgSelectTime.toFixed(2)}ms`);

        // Cleanup
        log('\n🧹 Cleaning up test data...');
        const [result] = await pool.query('DELETE FROM summaries WHERE text_hash LIKE ?', [TEST_DATA.textHash + '%']);
        log(`  ✅ Deleted ${result.affectedRows} rows`);
        log('\n🎯 TEST COMPLETE');

        // Summary
        log('\n📊 FINAL SUMMARY');
        log('---------------------');
        log(`Average Connection Time: ${avgConnectionTime.toFixed(2)}ms`);
        log(`Average Insert Time:     ${avgInsertTime.toFixed(2)}ms`);
        log(`Average Select Time:     ${avgSelectTime.toFixed(2)}ms`);

    } catch (error) {
        log(`❌ Test failed: ${error.message}`);
    } finally {
        await pool.end();
    }
}

runPerformanceTest().catch(console.error);

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'web_server',
    password: process.env.DB_PASSWORD || 'admin123',
    port: process.env.DB_PORT || 5432,
});

pool.connect(async (err, client, release) => {
    if (err){
        console.error('Error connecting to the database', err);
    }else{
        console.log('Connected to the database');
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    user_id SERIAL PRIMARY KEY,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    profile_image VARCHAR(255) DEFAULT NULL,
                    is_verified BOOLEAN DEFAULT FALSE,
                    is_admin BOOLEAN DEFAULT FALSE
                );

                CREATE TABLE IF NOT EXISTS email_verifications (
                    email VARCHAR(255) PRIMARY KEY,
                    token VARCHAR(255) NOT NULL
                );

                CREATE TABLE IF NOT EXISTS otp_requests (
                    otp_id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    otp_code VARCHAR(10) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    verified BOOLEAN DEFAULT FALSE
                );

                CREATE TABLE IF NOT EXISTS robots (
                    robots_id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                    token VARCHAR(255) NOT NULL UNIQUE,
                    robot_name VARCHAR(255) NOT NULL,
                    device_id VARCHAR(255) NOT NULL UNIQUE
                );
            `);
            console.log('Database tables verified/created successfully');
        } catch (tableErr) {
            console.error('Error initializing tables:', tableErr);
        }
        if (release) release();
    }
});

module.exports = pool;
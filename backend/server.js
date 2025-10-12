// Import necessary modules
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');

// Initialize the Express app
const app = express();
// Use process.env.PORT provided by Render, or default to 3000 for local development.
const port = process.env.PORT || 3000;

// --- CRITICAL PATH CONFIGURATION ---
// Define the correct absolute path to the frontend folder
// __dirname is '/backend', so '..' moves up to the project root, and then 'frontend' targets the folder
const frontendPath = path.join(__dirname, '..', 'frontend'); 
// -----------------------------------

// Middleware setup
app.use(cors());
app.use(express.json());

// Serve static files from the /frontend directory (includes index.js, CSS)
app.use(express.static(frontendPath)); 
app.use(express.static(path.join(frontendPath, 'public')));


// === FIX: Use DATABASE_URL for Render deployment ===
// The connection pool now reads the DATABASE_URL environment variable 
// set securely on the Render dashboard. It also enables SSL, which is 
// required for external cloud connections.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for connecting to Render DB from app
    }
});

// Test the database connection with an async function and try/catch
async function testDbConnection() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to the PostgreSQL database using Render credentials!');
        client.release(); 
    } catch (err) {
        console.error('Error connecting to the database:', err.stack);
        // NOTE: The application will still start even if the DB connection fails here.
    }
}

// --- NEW FUNCTION: ENSURE TABLE EXISTS ON STARTUP ---
async function ensureTableExists() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS test (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(255),
            message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(createTableQuery);
        console.log('Database table "test" checked/created successfully.');
    } catch (err) {
        // This is a critical error since the main API depends on this table
        console.error('CRITICAL: Failed to create "test" table:', err.stack);
    }
}
// ----------------------------------------------------


// Call the test function and then ensure the table exists
testDbConnection();
ensureTableExists();


// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Route to serve the dashboard.html file
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

// API route to handle form submissions
app.post('/api/contact', async (req, res) => {
    console.log('Received data from client:', req.body);
    
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    // SQL query for inserting data into the 'test' table.
    const insertQuery = `
        INSERT INTO test (name, email, subject, message)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [name, email, subject, message];

    try {
        const result = await pool.query(insertQuery, values);
        
        console.log('Successfully inserted data:', result.rows[0]);

        res.status(201).json({ 
            message: 'Thank you for your feedback!',
            data: result.rows[0]
        });

    } catch (err) {
        // This is the error that your form submission is catching (e.g., table 'test' doesn't exist)
        console.error('Error executing query:', err.stack);
        res.status(500).json({ error: 'Failed to save message. Please try again later.' });
    }
});

// API route to get all messages for the dashboard
app.get('/api/dashboard', async (req, res) => {
    try {
        const query = 'SELECT * FROM test ORDER BY name DESC;';
        const result = await pool.query(query);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching dashboard data:', err.stack);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

// API route to handle message deletion
app.delete('/api/dashboard/:name', async (req, res) => {
    const { name } = req.params;
    try {
        const query = 'DELETE FROM test WHERE name = $1;';
        const result = await pool.query(query, [name]);

        if (result.rowCount > 0) {
            res.status(200).json({ message: 'Message deleted successfully.' });
        } else {
            res.status(404).json({ error: 'Message not found.' });
        }
    } catch (err) {
        console.error('Error deleting message:', err.stack);
        res.status(500).json({ error: 'Failed to delete message. Please try again later.' });
    }
});

// Start the server
app.listen(port, () => {
    // This console log will now show the Render port (if set)
    console.log(`Backend server listening on port ${port}`);
    console.log('API endpoint for form submission is: POST /api/contact'); 
    console.log(`Access the application at https://richmondpersonal-profile.onrender.com`);
});

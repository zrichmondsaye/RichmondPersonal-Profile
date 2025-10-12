// Import necessary modules
const express = require('express');
const path = require('path'); // IMPORTANT: Needed to handle file paths correctly
const { Pool } = require('pg');
const cors = require('cors'); // Required to allow requests from your frontend

// Initialize the Express app
const app = express();
const port = 3000;

// --- CRITICAL PATH CONFIGURATION ---
// Define the correct absolute path to the frontend folder
// __dirname is '/backend', so '..' moves up to the project root, and then 'frontend' targets the folder
const frontendPath = path.join(__dirname, '..', 'frontend'); 
// -----------------------------------

// Middleware setup
// Use CORS to handle cross-origin requests from your frontend.
app.use(cors());
// Parse incoming JSON requests, which your form data will be sent as.
app.use(express.json());

// UPDATE: Serve static files from the new /frontend/public and /frontend directories.
// This allows the browser to load index.js, CSS, and other assets.
app.use(express.static(frontendPath)); // Serves files like index.html, dashboard.html, index.js
app.use(express.static(path.join(frontendPath, 'public'))); // Serves files from the /frontend/public folder


// Set up the PostgreSQL connection pool.
// It's highly recommended to use environment variables for sensitive data.
// Replace the placeholders with your actual database credentials.
const pool = new Pool({
    user: 'postgres',
    host: 'localhost', // e.g., 'localhost' or '127.0.0.1'
    // The database name has been changed back to the correct name.
    database: 'contact',
    password: '00000',
    port: 5432, // Default PostgreSQL port
});

// Test the database connection with an async function and try/catch
async function testDbConnection() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to the PostgreSQL database!');
        client.release(); // Release the client back to the pool
    } catch (err) {
        console.error('Error connecting to the database:', err.stack);
    }
}

// Call the test function
testDbConnection();


// UPDATE: Serve the HTML file from the new /frontend location
app.get('/', (req, res) => {
    // Uses the calculated frontendPath to find index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// UPDATE: New route to serve the dashboard.html file
app.get('/dashboard', (req, res) => {
    // Uses the calculated frontendPath to find dashboard.html
    res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

// API route to handle form submissions
// This will be a POST request from your frontend.
// Note: Changed endpoint from /api/index.html to a more standard /api/contact
app.post('/api/contact', async (req, res) => {
    // Log the request body to the console for debugging
    console.log('Received data from client:', req.body);
    
    // Extract data from the request body.
    const { name, email, subject, message } = req.body;

    // Basic validation to ensure all fields are provided.
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    // Define the SQL query for inserting data into your 'test' table.
    const insertQuery = `
        INSERT INTO test (name, email, subject, message)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [name, email, subject, message];

    try {
        // Execute the query using the connection pool.
        const result = await pool.query(insertQuery, values);
        
        // Log the result to the console for debugging.
        console.log('Successfully inserted data:', result.rows[0]);

        // Send a success response back to the client.
        res.status(201).json({ 
            message: 'Thank you for your feedback!',
            data: result.rows[0]
        });

    } catch (err) {
        // If an error occurs, log it and send an error response.
        console.error('Error executing query:', err.stack);
        res.status(500).json({ error: 'Failed to save message. Please try again later.' });
    }
});

// New API route to get all messages for the dashboard
app.get('/api/dashboard', async (req, res) => {
    try {
        // SQL query to fetch all messages. Order them by name for a consistent display.
        const query = 'SELECT * FROM test ORDER BY name DESC;';
        const result = await pool.query(query);

        // Send the data as a JSON response
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching dashboard data:', err.stack);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

// New API route to handle message deletion
// This will be a DELETE request from the frontend with the name of the message to delete.
app.delete('/api/dashboard/:name', async (req, res) => {
    const { name } = req.params;
    try {
        // SQL query to delete the message by name
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
    console.log(`Backend server listening at http://localhost:${port}`);
    // UPDATE: Changed the POST endpoint to a more semantically correct path
    console.log('API endpoint for form submission is: POST http://localhost:3000/api/contact'); 
    console.log('NEW API endpoint for dashboard data is: GET http://localhost:3000/api/dashboard');
    console.log('NEW API endpoint for deleting a message is: DELETE http://localhost:3000/api/dashboard/:name');
    console.log('Access the admin dashboard at http://localhost:3000/dashboard');
});

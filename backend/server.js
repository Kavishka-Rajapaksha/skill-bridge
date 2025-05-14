const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const host = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://165.232.179.196:3000',
    'http://165.232.179.196:3001',
    'http://165.232.179.196:3002'
  ],
  credentials: true
}));

// Routes
// Add health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'API is healthy' });
});

// Start server
app.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`);
});
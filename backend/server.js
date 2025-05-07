<<<<<<< Updated upstream
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
// Add health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
=======
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
// Add health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
>>>>>>> Stashed changes
});
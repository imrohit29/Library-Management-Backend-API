const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname)));

const adminRoutes = require('./backend/Routes/adminRoutes');
const dashboardRoutes = require('./backend/Routes/dashboardRoutes');
const bookRoutes = require('./backend/Routes/bookRoutes');
const studentRoutes = require('./backend/Routes/studentRoutes');
const transactionRoutes = require('./backend/Routes/transactionRoutes');

app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
  res.send('Library Management System API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

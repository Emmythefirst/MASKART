import dotenv from 'dotenv';

// Load environment variables
dotenv.config();


import app from './app.js';
import connectDB from './config/db.js';

// ← ADD THIS DEBUG LOG
console.log('🔍 Environment Check:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('STARPAY_API_KEY exists:', !!process.env.STARPAY_API_KEY);
console.log('STARPAY_API_KEY length:', process.env.STARPAY_API_KEY?.length || 0);
console.log('STARPAY_API_KEY first 10 chars:', process.env.STARPAY_API_KEY?.substring(0, 10) || 'NOT SET');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN}`);
  console.log(`🔗 API available at: http://localhost:${PORT}/api`);
});
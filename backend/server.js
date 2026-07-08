const path = require('path');
const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    return app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

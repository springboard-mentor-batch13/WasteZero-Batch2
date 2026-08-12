const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { swaggerSpec } = require('./docs/swagger');

// Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const pickupRoutes = require('./routes/pickupRoutes');
const pickupMatchingRoutes = require('./routes/pickupMatchingRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const matchingRoutes = require('./routes/matchingRoutes');


const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const adminReportRoutes = require('./routes/adminReportRoutes');
// Error Middleware
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// =========================
// Middleware
// =========================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      },
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// Health Check
// =========================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WasteZero backend is healthy',
  });
});

// =========================
// Swagger
// =========================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =========================
// API Routes
// =========================
app.use('/api/auth', authRoutes);

app.use('/api/profile', profileRoutes);

app.use('/api/pickups', pickupRoutes);

// Pickup Matching APIs
app.use('/api/pickups', pickupMatchingRoutes);

app.use('/api/opportunities', opportunityRoutes);

app.use('/api/application', applicationRoutes);
app.use('/api/applications', applicationRoutes);

app.use('/api/messages', messageRoutes);

app.use('/api/matches', matchingRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/admin', adminReportRoutes);
// =========================
// Error Handlers
// =========================
app.use(notFound);
app.use(errorHandler);

module.exports = app;
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { swaggerSpec } = require('./docs/swagger');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const pickupRoutes = require('./routes/pickupRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'WasteZero backend is healthy' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/opportunities', opportunityRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

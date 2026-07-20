# WasteZero Backend - Module A

This backend module provides the authentication flow for WasteZero Milestone 1, including:

## Features

- User Registration
- Registration OTP Verification
- User Login
- JWT-based Authentication
- Role-based Access Control (User, Volunteer, NGO, Admin)
- Input Validation using Express Validator
- Email OTP delivery using Nodemailer (SMTP)
- Swagger API Documentation

## Authentication Flow

### Registration

1. User submits registration details.
2. A 6-digit OTP is generated.
3. OTP is sent to the user's registered email.
4. User verifies the OTP.
5. Account is created only after successful OTP verification.

### Login

- Users can log in using their username and password after successful registration.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-register-otp` | Generate and send registration OTP |
| POST | `/api/auth/verify-register-otp` | Verify OTP and complete registration |
| POST | `/api/auth/register` | Direct user registration (legacy/testing) |
| POST | `/api/auth/login` | User login |

## Security

- Passwords are hashed using **bcrypt**
- Authentication handled using **JWT**
- OTP expires after **10 minutes**
- Duplicate email and username validation
- Input validation using **Express Validator**

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Nodemailer
- Express Validator
- Swagger UI

## API Documentation

Swagger UI is available at:

```
/api-docs
```

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

FRONTEND_URL=http://localhost:4200

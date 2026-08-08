# ♻️ WasteZero

WasteZero is a full-stack web application designed to connect **Volunteers, NGOs, and Administrators** for waste-management and community-cleanup activities.

The platform allows users to register based on their role, manage their profiles, discover and manage volunteering opportunities, submit and review applications, view role-specific dashboards, and communicate with other platform members.

---

## 📌 Project Overview

WasteZero provides a centralized platform where:

- **Volunteers** can discover opportunities and apply for them.
- **NGOs** can create and manage volunteering opportunities.
- **Admins** can monitor platform activity and manage applications.
- Users can communicate with other registered members through the messaging feature.
- Each role receives a dedicated dashboard and role-specific functionality.

---

# 🛠️ Technology Stack

## Frontend

- Angular
- TypeScript
- HTML
- CSS
- Angular Material
- Bootstrap Icons

## Backend

- Node.js
- Express.js
- REST APIs
- JWT Authentication
- bcrypt
- Express Validator

## Database

- MongoDB
- MongoDB Atlas
- Mongoose

## Development & Testing Tools

- Visual Studio Code
- Git
- GitHub
- Postman
- Swagger
- MongoDB Compass

---

# 🏗️ Application Architecture

WasteZero follows a full-stack architecture:

```text
Angular Frontend
       |
       | HTTP / REST API
       v
Node.js + Express Backend
       |
       | Mongoose ODM
       v
MongoDB Atlas
```

The Angular frontend communicates with REST APIs provided by the Express backend.

The backend handles:

- Authentication
- Authorization
- Business logic
- Input validation
- Database operations

MongoDB Atlas is used for persistent cloud database storage.

---

# 👥 User Roles

WasteZero currently supports three main roles.

## 👤 Volunteer

Volunteers can:

- Register and log in
- Manage their profile
- Browse available opportunities
- Search and filter opportunities
- View opportunity details
- Apply for opportunities
- Check application status
- View their role-specific dashboard
- Communicate with other users

## 🏢 NGO

NGO users can:

- Register and log in
- Manage their profile
- Create opportunities
- Edit opportunities
- Delete opportunities
- View their opportunities
- View opportunity/application statistics
- Access the NGO dashboard
- Communicate with platform members

## 🛡️ Admin

Administrators can:

- Log in securely
- Access the Admin dashboard
- View platform statistics
- View opportunities
- Review volunteer applications
- Accept applications
- Reject applications
- Monitor platform activity
- Communicate with users

---

# 🚀 Milestone 1 – User Management

## Objective

The objective of Milestone 1 was to establish the user-management foundation of WasteZero.

## Features Implemented

### User Registration

Users can create accounts with information such as:

- Username
- Full Name
- Email
- Password
- Role
- Location
- Skills

Supported roles:

```text
Admin
NGO
Volunteer
```

### Authentication

Authentication functionality includes:

- User registration
- Login
- Password hashing using bcrypt
- JWT-based authentication
- Protected backend routes
- Role-based authorization

### OTP Verification

OTP verification was integrated into the authentication workflow to support secure user verification.

### Profile Management

Users can:

- View their profile
- Update profile information
- Maintain role-specific user information

### Role-Based Access Control

Protected backend routes use authentication and authorization middleware to restrict functionality according to the logged-in user's role.

---

# 🗄️ Database Design

The WasteZero application uses MongoDB.

Main collections include:

```text
users
pickupRequests
wasteCategories
rewards
notifications
opportunities
applications
messages
```

## User Schema

Important user information includes:

```text
username
fullName
email
password
role
location
skills
createdAt
updatedAt
```

Indexes are used for fields such as:

- Username
- Email
- Role

Username and email are maintained as unique user identifiers where applicable.

---

# 🚀 Milestone 2 – Opportunity & Application Management

Milestone 2 expanded WasteZero from user management into a functional volunteering platform.

The major areas implemented during this milestone include:

- Opportunity Management
- Volunteer Applications
- Role-Based Dashboards
- Search and Filtering
- Application Status Management
- Messaging
- UI Theme Improvements

---

# 🌱 Opportunity Management

Opportunities can contain information such as:

```text
Title
Category
Description
Required Skills
Duration
City
State
Date
Location
Required Volunteers
Status
Image
```

## Opportunity Operations

The application supports:

- Create Opportunity
- View Opportunities
- View Opportunity Details
- Update Opportunity
- Delete Opportunity

Create/Edit/Delete operations are restricted according to authorized roles such as NGO/Admin.

---

# 🔍 Search and Filter

Users can discover opportunities using search and filtering functionality.

Supported filtering criteria include:

- Location
- Status
- Skill
- Category

This makes it easier for volunteers to find opportunities relevant to their interests and location.

---

# 📝 Volunteer Application Management

Volunteers can apply for available opportunities.

The application system supports statuses such as:

```text
Pending
Accepted
Rejected
```

A volunteer can view the current status of their application from the opportunity workflow.

Administrators can review submitted applications and either:

```text
Accept
Reject
```

applications.

The UI provides visually distinct status indicators for Pending, Accepted, and Rejected applications.

---

# 📊 Role-Based Dashboards

Dedicated dashboards are provided for different user roles.

## Volunteer Dashboard

The Volunteer dashboard displays statistics such as:

- Available Opportunities
- My Applications
- Pending Opportunities
- Completed Opportunities

## NGO Dashboard

The NGO dashboard provides statistics related to:

- Opportunities
- Applications
- Opportunity status
- Completed drives

The dashboard uses backend statistics rather than only static frontend values.

## Admin Dashboard

The Admin dashboard provides platform-level information such as:

- Total Users
- Total Opportunities
- Admin Opportunities
- NGO Opportunities

---

# 💬 Messaging Feature

Milestone 2 introduces communication between registered WasteZero users.

The messaging backend provides APIs for:

```text
GET  /api/messages/users
POST /api/messages/send
GET  /api/messages/conversation/:userId
```

## Messaging Capabilities

Users can:

- View registered users grouped by role
- Select another member
- Open a conversation
- Send messages
- Retrieve previous messages

Users are organized under:

```text
Admin
NGO
Volunteer
```

Messages are persisted using the backend and MongoDB rather than relying on frontend-only mock messages.

---

# 🎨 Light and Dark Theme

WasteZero provides a consistent application theme across major pages.

UI improvements include:

- Light theme
- Dark theme
- Improved text visibility
- Navbar styling
- Sidebar styling
- Dashboard styling
- Opportunity page styling
- Application page styling
- Status chip styling
- Form and dropdown visibility

Special attention was given to maintaining readable text, borders, backgrounds, and status indicators in dark mode.

---

# 🔐 Security

WasteZero implements several security mechanisms.

### JWT Authentication

Protected APIs require a valid authentication token.

Requests use:

```text
Authorization: Bearer <JWT_TOKEN>
```

### Password Security

Passwords are hashed before being stored in the database.

### Role-Based Authorization

Backend routes restrict operations depending on whether the authenticated user is:

```text
Admin
NGO
Volunteer
```

### Input Validation

Backend APIs use validation to reject invalid request data before processing it.

---

# 📡 Major REST API Areas

The backend contains API routes for functionality including:

```text
/api/auth
/api/profile
/api/opportunities
/api/application
/api/applications
/api/messages
```

These APIs connect the Angular frontend with the Node.js/Express backend and MongoDB database.

---

# 👩‍💻 Team Contributions

## Jahnavi – Database Developer & Team Lead

Responsibilities and contributions include:

- Database design
- MongoDB integration
- Database schema documentation
- Database collection planning
- Backend/frontend integration
- Git branch and PR integration
- Merge-conflict resolution
- Feature testing
- API testing
- Dashboard integration
- Opportunity and application integration
- Role-based dashboard improvements
- Light/Dark theme integration
- Final integration testing

As Team Lead, responsibilities also include reviewing team changes, integrating features, resolving conflicts, and validating the complete application.

## Ritika – Backend Development

Major contribution areas include:

- Backend development
- API implementation
- Authentication/backend functionality
- Messaging backend APIs
- Message model and controller implementation
- Conversation retrieval
- Message persistence

## Kavipriya – Backend Development

Major contribution areas include:

- Backend authentication
- Backend API development
- Integration support
- Opportunity/backend functionality

## Gaytri – Frontend Development

Major contribution areas include:

- Frontend UI development
- Profile-related frontend functionality
- Messages UI
- Role/member messaging interface
- Frontend integration

## Arati – Frontend / Feature Development

Major contribution areas include:

- Frontend development
- Opportunity-related functionality
- Search API integration
- Filter functionality
- Dashboard statistics functionality
- Milestone 2 integration support

---

# 📂 Project Structure

```text
WasteZero-Batch2/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   └── pages/
│   │   │       ├── applications/
│   │   │       ├── dashboard/
│   │   │       ├── messages/
│   │   │       └── opportunities/
│   │   └── styles.css
│   │
│   └── package.json
│
├── database/
│   └── DATABASE_DESIGN.md
│
└── README.md
```

---

# ⚙️ Running the Project Locally

## 1. Clone the Repository

```bash
git clone <repository-url>
cd WasteZero-Batch2
```

## 2. Backend Setup

```bash
cd backend
npm install
```

Configure the required environment variables in the backend `.env` file.

Typical configuration includes:

```env
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
```

Then start the backend:

```bash
npm start
```

The backend runs on:

```text
http://localhost:5001
```

## 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm start
```

The Angular frontend normally runs on:

```text
http://localhost:4200
```

---

# 🧪 Testing

The project has been tested across the major Milestone 1 and Milestone 2 workflows.

Testing includes:

- Registration
- Login
- Authentication
- Role authorization
- Profile functionality
- Admin dashboard
- NGO dashboard
- Volunteer dashboard
- Opportunity creation
- Opportunity editing
- Opportunity deletion
- Opportunity search
- Opportunity filtering
- Volunteer applications
- Application acceptance
- Application rejection
- Application status
- Messaging APIs
- User conversations
- Light/Dark theme
- Responsive UI behavior

Backend APIs can also be tested using tools such as Postman and Swagger.

---

# 🔄 Development Workflow

The project uses Git and GitHub for collaborative development.

Team members work on separate branches and submit their changes for integration.

Typical workflow:

```bash
git checkout <branch-name>

git add .

git commit -m "Description of changes"

git push origin <branch-name>
```

Changes are reviewed and integrated before final testing.

---

# ✅ Milestone Status

## Milestone 1

**User Management – Completed**

- Registration
- Authentication
- Role-based access
- Profile management
- Database integration

## Milestone 2

**Opportunity & Application Management – Implemented**

- Opportunity CRUD
- Search and filtering
- Volunteer applications
- Application status management
- Admin application management
- Volunteer dashboard
- NGO dashboard
- Admin dashboard
- Messaging backend and UI integration
- Light/Dark theme improvements
- Integration and testing

---

# 🌍 Project Goal

WasteZero aims to make community waste-management initiatives easier to organize by connecting volunteers, NGOs, and administrators through one centralized digital platform.

The project focuses on improving collaboration, opportunity discovery, volunteer participation, application management, and communication while promoting cleaner and more sustainable communities.
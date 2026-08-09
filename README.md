♻️ WasteZero

WasteZero is a full-stack waste-management and community-cleanup platform connecting Volunteers, NGOs, and Administrators. It supports user management, volunteering opportunities, applications, communication, pickup coordination, role-based dashboards, and administrative workflows.

🛠️ Technology Stack

Frontend: Angular, TypeScript, HTML, CSS, Angular Material, Bootstrap IconsBackend: Node.js, Express.js, REST APIs, JWT, bcrypt, Express ValidatorDatabase: MongoDB, MongoDB Atlas, MongooseTools: VS Code, Git, GitHub, Postman, Swagger, MongoDB Compass

🏗️ Architecture

Angular Frontend
       │
       │ HTTP / REST APIs
       ▼
Node.js + Express Backend
       │
       │ Mongoose
       ▼
MongoDB Atlas

The backend handles authentication, authorization, validation, business logic, and database operations.

👥 User Roles

Volunteer

Register, authenticate, and manage profile

Discover, search, and filter opportunities

Apply for opportunities and track application status

Manage pickup requests and pickup progress

Upload pickup proof and report pickup issues

Use role-specific dashboard and messaging

NGO

Manage NGO profile and volunteering opportunities

Review volunteer applications

Manage assigned pickup requests

Accept/reject pickups and handle pickup status updates

View NGO dashboard statistics

Communicate with platform members

Admin

Access platform-level dashboards

Monitor users, opportunities, and applications

Review platform activity and manage administrative workflows

🚀 Milestone 1 – User Management

Objective: Build the secure user-management and authentication foundation.

Implemented

User registration for Admin, NGO, and Volunteer roles

Login with JWT authentication

Password hashing using bcrypt

OTP verification

Protected routes and role-based authorization

Profile viewing and editing

MongoDB database integration

User schema, indexes, timestamps, and database documentation

🚀 Milestone 2 – Opportunity & Application Management

Objective: Expand WasteZero into a functional volunteering platform.

Implemented

Opportunity CRUD for authorized users

Opportunity details and management

Search and filtering by relevant opportunity attributes

Volunteer application workflow

Application statuses: Pending, Accepted, Rejected

Role-based Volunteer, NGO, and Admin dashboards

Dashboard statistics backed by APIs

User-to-user messaging and conversation persistence

Light/Dark theme and UI improvements

Frontend-backend integration and workflow testing

🚀 Milestone 3 – Pickup Management

Objective: Introduce end-to-end waste pickup coordination between Volunteers and NGOs.

Implemented

Volunteer pickup request creation and management

NGO assigned-pickup request dashboard

Pickup details, location, date, time, and waste-type information

NGO accept/reject workflow

Volunteer pickup lifecycle:

Pending

Accepted

In Progress

Rescheduled

Completed

Rejected

Scheduled pickup-date validation before starting a pickup

Pickup start and completion workflows

Pickup proof upload

Unable-to-complete pickup issue reporting

Pickup rescheduling workflow

Volunteer withdrawal and rejected-request deletion

Pickup status filtering and role-specific UI

Pickup dashboards with summary statistics

Frontend/backend integration and end-to-end testing

🗄️ Database

Main MongoDB collections include:

users
pickupRequests
wasteCategories
rewards
notifications
opportunities
applications
messages

User records include fields such as username, full name, email, password, role, location, skills, createdAt, and updatedAt. Unique/indexed fields are used where appropriate.

🔐 Security

JWT-based authentication

Bearer-token protected APIs

bcrypt password hashing

Role-based authorization

Express input validation

Protected frontend/backend workflows

📡 Major API Areas

/api/auth
/api/profile
/api/opportunities
/api/application
/api/applications
/api/messages
/api/pickups

📂 Project Structure

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
│   │   └── styles.css
│   └── package.json
│
├── database/
│   └── DATABASE_DESIGN.md
│
└── README.md

⚙️ Running Locally

Backend

cd backend
npm install
npm start

Backend:

http://localhost:5000

Configure the backend .env with the required MongoDB URI and JWT secret.

Frontend

cd frontend
npm install
npm start

Frontend:

http://localhost:4200

🧪 Testing

Testing has covered the major implemented workflows across Milestones 1–3, including:

Registration and login

OTP and authentication

Role-based authorization

Profile management

Dashboards and statistics

Opportunity CRUD

Search and filtering

Volunteer applications

Application acceptance/rejection

Messaging

Pickup creation and assignment

Pickup accept/reject

Pickup start, reschedule, and completion

Pickup proof and issue reporting

Withdrawal and deletion workflows

API and integration testing

Responsive UI and theme behavior

Backend APIs can be tested using Postman and Swagger.

🔄 Development Workflow

The project uses Git and GitHub for collaborative development.

git checkout <branch-name>
git add .
git commit -m "Description of changes"
git push origin <branch-name>

Team changes are reviewed, integrated, tested, and merged into the project.

✅ Milestone Status

Milestone

Focus

Status

Milestone 1

User Management & Authentication

✅ Completed

Milestone 2

Opportunities, Applications, Dashboards & Messaging

✅ Completed

Milestone 3

Pickup Management & Coordination

✅ Completed

Milestone 4

Reporting & Administration

🔄 Next

🌍 Project Goal

WasteZero aims to simplify community waste-management by connecting volunteers, NGOs, and administrators through one centralized platform, improving opportunity discovery, volunteer participation, pickup coordination, communication, and administrative oversight.
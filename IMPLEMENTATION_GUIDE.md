# Implementation Guide: Smart Complaint Escalation & SLA Management System

This document outlines all the steps taken to scaffold the full-stack MERN application for the internship assessment, and explains *how* the process was executed.

## 1. Project Initialization

### Backend Setup
- Created a `backend` folder.
- Initialized a Node.js project using `npm init -y`.
- Installed necessary dependencies: `express`, `mongoose` (for MongoDB), `dotenv` (for environment variables), `cors` (for cross-origin requests), `jsonwebtoken` (for authentication), `bcrypt` (for password hashing), and `nodemon` (for auto-restarting the dev server).
- Created a `.env` file to securely store the MongoDB connection string and JWT Secret.

### Frontend Setup
- Created a `frontend` folder.
- Initialized a React project using Vite: `npx create-vite@latest frontend --template react`.
- Installed dependencies: `react-router-dom` (for routing), `axios` (for API requests), and Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss`).
- Configured Vite (`vite.config.js`) and CSS (`src/index.css`) to use Tailwind CSS v4's new setup.

## 2. Generating the Code Architecture

To speed up development and ensure best practices, two generator scripts were created and executed:

### A. \`generate_backend.js\`
This script was used to automatically generate the Model-View-Controller (MVC) architecture for the Express API. It created:
- **Models (`src/models`)**: Created Mongoose schemas for `User` and `Complaint`. The `Complaint` schema includes SLA tracking fields like `priority`, `slaStatus`, and `slaDeadline`.
- **Middleware (`src/middleware/auth.js`)**: Implemented a JWT-based `protect` middleware to secure routes.
- **Routes (`src/routes`)**: Created `authRoutes` for login and `complaintRoutes` for creating and fetching complaints.
- **Server Entry (`server.js`)**: Configured Express, connected to MongoDB, and mounted the API routes.

### B. \`generate_frontend.js\`
This script scaffolded the React application structure. It created:
- **Routing (`src/App.jsx`)**: Set up React Router to handle navigation between pages.
- **Authentication Page (`src/pages/Login.jsx`)**: Created a UI for users to log in, saving the JWT token in `localStorage`.
- **Dashboard (`src/pages/Dashboard.jsx`)**: Built a modern interface with a sidebar and a data table to view all complaints, formatted with Tailwind CSS. Priority labels were color-coded.
- **Complaint Management**: Created `CreateComplaint.jsx` for submitting new issues and `ComplaintDetails.jsx` to view specific SLAs and escalation states.

## 3. Database Seeding

To ensure the application was ready to be demonstrated immediately, a `seed.js` script was created.
- This script clears the existing database and injects **4 default users** (Admin, Manager, Agent, Customer) and **1 demo complaint**.
- The script was executed to populate the local MongoDB instance (`mongodb://localhost:27017/complaints_db`).

## 4. Running the Development Servers

Finally, background tasks were launched to start both the frontend and backend servers simultaneously:
- **Backend**: `npx nodemon server.js` (Running on port 5000)
- **Frontend**: `npm run dev` (Running on port 5173)

## Summary of How It Was Done
Instead of writing 20+ individual files manually line-by-line, Node.js scripts (`generate_backend.js` and `generate_frontend.js`) were used to programmatically generate the boilerplate code. This ensured a clean separation of concerns, rapid prototyping, and immediate working functionality required by the internship evaluation criteria.

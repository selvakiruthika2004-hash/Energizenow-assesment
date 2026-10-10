# SmartServe — Omnichannel Complaint & Service Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A full-stack, enterprise-grade service request and dispute resolution platform featuring smart NLP triage, automated workload balancing, automated SLA escalation, 24/7 helpline omnichannel intake, and role-based portals.

---

## 🌐 Live Web Application Demo

Experience the live application right now:
👉 **[https://1286ec68e4790f.lhr.life](https://1286ec68e4790f.lhr.life)**

### 🔑 Demo Login Credentials (All passwords: `password123`)

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@test.com` | `password123` | Full control, live status updates, incoming call radar, SLA overrides, analytics |
| **Operations Manager** | `manager1@test.com` | `password123` | Escalation reviews, department analytics, SLA metrics |
| **Support Agent** | `agent1@test.com` | `password123` | Assigned queue, status workflows, resolution notes |
| **Customer** | `customer1@test.com` | `password123` | Omnichannel ticket tracking (`💻 Via Register` & `📞 Through Call`), new complaints |

---

## 🚀 Key Architectural Capabilities

### 1. 📞 Omnichannel Customer Helpline (Web + Phone)
- **Customer Helpline Widget**: Customers unable or hesitant to file web forms can place direct helpline calls or request agent intake.
- **Admin Incoming Call Radar**: Live incoming call alert dashboard with real-time badges. Admins can answer calls and instantly file a pre-filled ticket on behalf of the caller.
- **Channel Transparency**: Every ticket is stamped with its intake method (`REGISTER` vs `CALL`). Customers see clear badges indicating how their issue was logged.

### 2. ⚡ Dynamic Real-Time Status Lifecycle
- **Inline Admin Status Controls**: Admin and agents can update complaint statuses (`PENDING` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `RESOLVED` / `REJECTED`) directly with optimistic UI updates.
- **State Transition Safeguards**: Mandates resolution summaries when closing tickets and formal rejection justifications.
- **Full Audit History**: Every state transition generates immutable activity logs recording timestamps and responsible users.

### 3. 🧠 Smart NLP Triage & Auto-Assignment Engine
- **Automated Urgency Inference**: Evaluates ticket descriptions using natural language keyword matching to compute severity (`URGENT`, `HIGH`, `MEDIUM`, `LOW`).
- **Department Categorization**: Automatically routes tickets to specialized departments (IT, Finance, Hardware, Customer Service).
- **Least-Loaded Round-Robin Balancer**: MongoDB aggregation pipelines determine the current active ticket workload of all department agents, assigning new complaints to the least-burdened staff member.

### 4. ⏱️ Automated SLA Tracking & Background Escalation
- **Dynamic SLA Matrix**: Calculates guaranteed first-response and resolution deadlines based on ticket priority.
- **Automated Cron Monitor**: Periodic background worker detects SLA breaches and automatically escalates neglected tickets to department managers.

### 5. 📊 Executive Analytics & Metrics
- Visualizes department throughput, resolution efficiency, average turnaround time, and SLA compliance percentages using interactive Recharts diagrams.

---

## 🛠️ Technology Stack

```
├── Frontend: React 18 (Vite), React Router v6, Tailwind CSS, Recharts, Lucide Icons
├── Backend:  Node.js, Express.js (REST API, Reverse Proxy, Route Guards)
├── Database: MongoDB & Mongoose (Aggregation pipelines, indexes, data models)
├── Security: JWT (JSON Web Tokens), bcrypt hashing, CORS protection, Role-Based Access Control (RBAC)
└── Tooling:  Cron Jobs, LocalTunnel / SSH reverse tunnel, Git SCM
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/         # MongoDB connection config
│   │   ├── middleware/     # JWT authentication & RBAC role guards
│   │   ├── models/         # Mongoose schemas (User, Complaint, Department, CallLog, Audit)
│   │   ├── routes/         # REST API endpoints (auth, complaints, calls, analytics)
│   │   ├── services/       # Smart triage, assignment engine, cron SLA worker
│   │   └── utils/          # Token generation & helpers
│   ├── .env.example        # Environment variable template
│   ├── seed.js             # Database seeder with realistic test data
│   └── server.js           # Express app entrypoint & middleware
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, Navbar, Status badges, Call modal
│   │   ├── pages/          # Dashboard, ComplaintDetails, Calls, Analytics, Login, Register
│   │   └── utils/          # Dynamic API client base configuration
│   ├── vite.config.js      # Vite build config & backend API reverse proxy
│   └── package.json        # Frontend dependencies & scripts
│
├── .gitignore              # Clean root git ignore specification
└── README.md               # Recruiter documentation and project overview
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- [Node.js (v18+)](https://nodejs.org/)
- [MongoDB Community Edition](https://www.mongodb.com/try/download/community) running locally on port `27017`

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
node seed.js    # Seeds demo users, departments, and complaints
npm start       # Launches server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev     # Launches Vite dev server on http://localhost:5173
```

Visit **http://localhost:5173** to explore the application locally.

---

## 📡 REST API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new customer
- `POST /api/auth/login` — Authenticate and receive JWT token

### Complaints (`/api/complaints`)
- `GET /api/complaints` — Retrieve complaints (scoped by role)
- `POST /api/complaints` — File a new complaint with smart triage & auto-assignment
- `GET /api/complaints/:id` — Get comprehensive ticket details and audit trail
- `PUT /api/complaints/:id/status` — Transition complaint status

### Helpline & Calls (`/api/calls`)
- `POST /api/calls` — Customer initiates a helpline call
- `GET /api/calls` — Admin fetches incoming and completed calls
- `POST /api/calls/:id/file-complaint` — Admin files complaint from call log

### Analytics (`/api/dashboard`)
- `GET /api/dashboard/analytics` — Fetch SLA metrics, category counts, and resolution rates

---

## 📄 License
This project is open-source under the MIT License.

# ZCOR – SaaS Web Application for Small Business Administration

ZCOR is a full-stack Software-as-a-Service (SaaS) web application designed to help small businesses manage their day-to-day operations in one place. It centralizes **work time tracking**, **staff scheduling**, and **inventory management** into a single, easy-to-use platform.

This project is developed as a capstone for the **Master’s in Professional Computer Science (MPCS)** program at Simon Fraser University.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Project Structure](#project-structure)
- [Planned Roadmap](#planned-roadmap)
- [Status](#status)
- [License](#license)
- [Contact](#contact)

---

## Overview

Small and medium-sized businesses often rely on a mix of spreadsheets, paper-based processes, and disconnected tools to manage time tracking, staff scheduling, and inventory. This leads to duplicated effort, inconsistent data, and poor visibility into how the business is actually running.

**ZCOR** aims to solve this by providing:

- A **single web-based platform** where owners, managers, and employees can interact with core operations.
- A **multi-tenant** architecture so multiple businesses can use the system with proper data isolation.
- Role-based access so that each user only sees what they need (e.g., owner, manager, employee).

The long-term vision is for ZCOR to be a realistic foundation for a production-style SaaS product that could be extended with more advanced reporting and integrations.

---

## Core Features

### 1. Work Time Tracking

- Employees can **clock in** and **clock out** through the web app.
- The system stores **time logs** for each employee.
- Managers can **view timesheets** aggregated by employee and date range.

### 2. Staff Scheduling

- Managers can **create and edit work schedules** (e.g., weekly or monthly views).
- Employees can **view their upcoming shifts** and their assigned schedule.
- Calendar-style UI for at-a-glance understanding of who is working when.

### 3. Inventory Management

- Businesses can **create and manage inventory items** (name, category, stock level, etc.).
- The system tracks **stock changes** (items added or removed).
- Low-stock items are **highlighted based on configurable thresholds** to support timely reordering.

### 4. Dashboards & Overviews

- Summary views such as:
  - Total hours worked in a selected period.
  - Today’s and upcoming shifts.
  - Current inventory status and low-stock items.
- Designed to give managers an **operational snapshot** without exporting data to other tools.

### 5. Multi-Tenant & Role-Based Access

- Each user belongs to a **business (tenant)**; all core entities are associated with a business.
- Roles such as **Owner**, **Manager**, and **Employee** control access to features.
- Tenant separation enforced at the API and data layers.

---

## Tech Stack

**Frontend**

- [React.js](https://react.dev/) – single-page application (SPA) frontend.
- React Router – client-side routing.
- (Optional) UI library (e.g., MUI / Chakra / Tailwind CSS) for styling components.

**Backend**

- [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/) – RESTful APIs and business logic.
- JSON Web Tokens (JWT) or similar for authentication and authorization.

**Database**

- [MongoDB](https://www.mongodb.com/) – NoSQL document database, storing:
  - Users, businesses, roles
  - Time logs, shifts
  - Inventory items, stock movements

**Deployment & Infrastructure**

- **Docker** – containerization of backend services.
- **AWS Lambda** – serverless deployment of backend APIs (via API Gateway).
- **GitHub Pages** – hosting of the React frontend in a production-like environment.

---

## Architecture

At a high level:

- The **frontend** is a React SPA that communicates with the backend via JSON-based HTTP APIs.
- The **backend** is a Node.js/Express application exposing routes for:
  - Authentication & user management
  - Time tracking
  - Scheduling
  - Inventory operations
- **Multi-tenancy** is implemented by associating each user and business entity with a `businessId`. All queries are scoped by this ID.
- **Role-based access** is enforced on protected routes, checking the user’s role (e.g., owner/manager/employee).
- **MongoDB** is used to store all domain entities with appropriate indexes (e.g., `businessId`, `userId`, `itemId`).

A more detailed architecture diagram and API reference will be added as the project evolves.

---

## Getting Started

> ⚠️ Note: This section describes a **local development setup**. Exact commands/paths may change as the project evolves.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Access to a MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [Docker](https://www.docker.com/) (for containerization/deployment steps)

Clone the repository:

```bash
git clone https://github.com/Puthyporsk/zcor.git
cd zcor
```

### Environment Variables

Create environment files for **backend** and **frontend** (examples):

**Backend** (`/backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db-name>
JWT_SECRET=super-secret-key
NODE_ENV=development
```

**Frontend** (`/frontend/.env`)

```env
API_BASE_URL=https://your-api-url.example.com
```

> These values are placeholders. Use your own secrets and URLs.

---

### Backend Setup

```bash
cd backend
npm install

# Run in development mode
npm run dev
```

This should start the API server (e.g., on `http://localhost:5000`) with a basic health endpoint.

---

### Frontend Setup

```bash
cd frontend
npm install

# Run the React dev server
npm run dev
```

By default, the frontend will run on something like `http://localhost:3000` (or similar, depending on your tooling). Make sure `API_BASE_URL` points to your backend URL.

---

## Project Structure

A possible high-level structure (subject to change):

```text
zcor/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose models (User, Business, TimeLog, Shift, InventoryItem, …)
│   │   ├── routes/          # Express route definitions
│   │   ├── controllers/     # Request handlers / business logic
│   │   ├── middleware/      # Auth, error handling, tenant scoping
│   │   └── index.js         # App entrypoint
│   ├── tests/               # Backend tests
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Pages (Login, Dashboard, Time, Schedule, Inventory, Admin, …)
│   │   ├── hooks/           # Custom hooks (e.g., auth, API calls)
│   │   ├── router/          # Route configuration
│   │   └── main.jsx  # Application entrypoint
│   ├── public/
│   └── package.json
│
├── docs/                    # Architecture diagrams, API docs, design notes
├── .github/
│   └── workflows/           # CI/CD (tests, deploy)
└── README.md
```

---

## Planned Roadmap

The project is being developed over roughly **3 months** with three major milestones:

1. **Milestone 1 – Foundational Platform**
   - Core project setup (frontend, backend, DB, auth).
   - Basic multi-tenant structure and role-based access.
   - Skeleton dashboard and navigation.

2. **Milestone 2 – Core Functional Modules**
   - Time tracking: clock in/out, timesheets, manager views.
   - Staff scheduling: shift creation, calendar view, employee schedules.
   - Inventory: CRUD items, stock movements, low-stock highlighting.
   - Basic dashboards and admin pages (user/role management).

3. **Milestone 3 – Finalization & Evaluation**
   - Usability and UI refinements.
   - Testing and code quality improvements.
   - Containerization and cloud deployment (Docker, AWS Lambda, GitHub Pages).
   - Documentation (architecture, setup, user guide) and final demo preparation.

For more details, see the project’s capstone proposal and design documents in the `docs/` directory (to be added).

---

## Status

> 🚧 **Work in Progress**

ZCOR is under active development as part of a capstone project. Features, APIs, and structures are subject to change as the design is refined and new requirements emerge.

---

## License

To be decided.  
(For now, the project is primarily for academic use. A formal license will be added if/when it is open-sourced.)

---

## Contact

**Author:** Puthypor (Por) Sengkeo  
**Program:** Master’s in Professional Computer Science (MPCS)  

If you have questions, suggestions, or feedback, feel free to open an issue or reach out.

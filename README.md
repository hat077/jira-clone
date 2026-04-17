# 🚀 JiraClone - Full-Stack Agile Workspace Platform

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Live Demo:** [Visit the Application](https://jira-clone-eight-blond.vercel.app)

JiraClone is a production-ready, multi-tenant project management platform. Designed with enterprise SaaS architecture in mind, it features secure role-based access control (RBAC), real-time interactive Kanban boards, advanced data visualization, and global search capabilities.

---

## ✨ Key Features

* **🏢 Multi-Tenant Workspaces:** Users can create and switch between isolated organizational workspaces. Data is strictly scoped to the active workspace.
* **🔐 Role-Based Access Control (RBAC):** Granular permissions supporting `Admin` and `Viewer` roles. Admins can manage projects and invite teammates; viewers have read-only access.
* **📋 Interactive Kanban Board:** Drag-and-drop issue tracking with optimistic UI updates for zero-latency status changes.
* **📊 Analytics Dashboard:** Personal productivity tracking with visual data representation (Donut and Bar charts) using Recharts.
* **🔍 Advanced Filtering & Search:** Client-side instant filtering by priority, assignee, and text, coupled with a backend global search across all workspace projects.
* **📜 Audit Trails & Collaboration:** Every issue tracks a system-generated history log of status changes alongside user comments.
* **🛡️ Robust Authentication:** JWT-based authentication with Bcrypt password hashing.

---

## 🛠️ Tech Stack & Architecture

### **Frontend (Client)**
* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS
* **State Management:** React Context API
* **Drag & Drop:** `@hello-pangea/dnd`
* **Data Visualization:** Recharts
* **Deployment:** Vercel

### **Backend (API)**
* **Framework:** FastAPI (Python)
* **ORM:** SQLAlchemy
* **Authentication:** PyJWT, Passlib (Bcrypt)
* **Database:** PostgreSQL (Hosted on Supabase)
* **Deployment:** Render

---

## 💻 Local Development Setup

If you want to run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/hat077/jira-clone.git
cd jira-clone
```

### 2. Backend Setup
Navigate to the backend directory, set up your virtual environment, and start the FastAPI server:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql://postgres:your_password@db.supabase.co:6543/postgres
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Run the server:

```bash
uvicorn app.main:app --reload
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and start the Next.js development server:

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the client:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🧠 Engineering Decisions & Challenges

* **Optimistic UI:** Implemented optimistic state updates on the Kanban board to ensure drag-and-drop operations feel instantaneous, handling database synchronization asynchronously in the background.
* **Database Cascades:** Configured SQLAlchemy `delete-orphan` cascades to ensure that when a project is deleted, all associated issues, comments, and audit logs are safely and cleanly removed to prevent orphaned data.
* **CORS & Deployment:** Successfully architected a split deployment model (Serverless Frontend on Vercel, Dedicated Server on Render) handling complex cross-origin resource sharing and database connection pooling.

---
*Designed and engineered by Hatim Oudghiri.*
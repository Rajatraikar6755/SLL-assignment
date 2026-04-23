# SkillBridge Attendance Management System

A full-stack attendance management system built for students, trainers, institutions, and programme oversight.

## 🚀 Live Links
- **Frontend**: [https://sll-assignment.vercel.app](https://sll-assignment.vercel.app)
- **Backend API**: [https://sll-assignment-production.up.railway.app/api](https://sll-assignment-production.up.railway.app/api)
- **Health Check**: [https://sll-assignment-production.up.railway.app/api/health](https://sll-assignment-production.up.railway.app/api/health)

## 🔑 Test Accounts
Please use these credentials to test each role. 
*(Note: These are pre-registered in the Clerk test environment)*

| Role | Email | Password |
|------|-------|----------|
| **Programme Manager** | pm@test.com | Password123! |
| **Monitoring Officer** | monitor@test.com | Password123! |
| **Institution** | inst@test.com | Password123! |
| **Trainer** | trainer@test.com | Password123! |
| **Student** | student@test.com | Password123! |

## 🛠️ Local Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database (or a Neon.tech connection string)
- Clerk API Keys (Publishable & Secret)

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file with:
# DATABASE_URL=your_postgresql_url
# CLERK_SECRET_KEY=your_clerk_secret
# FRONTEND_URL=http://localhost:3000
npx prisma db push
node index.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Create a .env.local file with:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_pk
# CLERK_SECRET_KEY=your_sk
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

## 🏗️ Schema Decisions
- **Unified User Model**: We use a single `User` table linked to Clerk via `clerkUserId`. Roles are managed via an Enum for strict RBAC.
- **Relational Integrity**: 
    - `Batch`: The core organization unit.
    - `BatchTrainer` / `BatchStudent`: Explicit many-to-many join tables to allow trainers/students to belong to multiple batches.
    - `Attendance`: Uses a unique composite key `(sessionId, studentId)` to prevent duplicate marking.
- **Prisma ORM**: Chosen for type-safety and the ability to use `db push` for rapid prototyping without complex migration files.

## 📚 Stack Choices
- **Frontend**: **Next.js 15 (App Router)** for fast, server-side rendered dashboards and built-in routing.
- **Backend**: **Node.js/Express** for a lightweight, scalable REST API.
- **Auth**: **Clerk** chosen over custom JWT for its robust security, social login options, and managed session handling.
- **Database**: **Neon PostgreSQL** for serverless scaling and ease of deployment.
- **Styling**: **Vanilla CSS** with a custom design system (CSS Variables) to ensure maximum performance and total design control.

## ✅ Implementation Status
- **Fully Working**: 
    - Role-based Onboarding & Redirection.
    - Batch and Session creation for Trainers/Institutions.
    - Invite link generation and Student joining flow.
    - Live attendance marking for Students.
    - Detailed analytics breakdown for all 5 roles.
- **Partially Done**: 
    - Profile editing (limited to role-specific data).
- **Skipped**: 
    - Real-time Push Notifications (Dashboard summaries used instead).

## 💡 Reflection
**With more time, what would I do differently?**
I would implement **Geolocation Verification** for student attendance. This would ensure that students are physically present at the training center when they mark themselves as "Present," adding an extra layer of integrity to the data.

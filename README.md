# SkillBridge Attendance System - Submission

This is my full-stack submission for the attendance management system. It's built to handle everything from students marking their daily attendance to high-level monitoring for programme managers.

## 🔗 Project Links
*   **Frontend (Main Site)**: [https://sll-assignment.vercel.app](https://sll-assignment.vercel.app)
*   **Backend API**: [https://sll-assignment-production.up.railway.app/api](https://sll-assignment-production.up.railway.app/api)
*   **API Health Check**: [https://sll-assignment-production.up.railway.app/api/health](https://sll-assignment-production.up.railway.app/api/health)

## 🔑 Login to Test (Test Accounts)
I've set up these accounts in Clerk for easy testing of each role:

| Who is it? | Email | Password |
|------------|-------|----------|
| **Programme Manager** | pm@test.com | Password123! |
| **Monitoring Officer** | monitor@test.com | Password123! |
| **Institution User** | inst@test.com | Password123! |
| **Trainer** | trainer@test.com | Password123! |
| **Student** | student@test.com | Password123! |

## 💻 Running it locally
1.  **Backend**: Go to `/backend`, run `npm install`, add your `.env` (database and clerk keys), then run `npx prisma db push` and `node index.js`.
2.  **Frontend**: Go to `/frontend`, run `npm install`, add `.env.local`, and run `npm run dev`.

## 🧠 My Design Choices
### The Database (Schema)
I used a PostgreSQL database with Prisma. I decided to keep the **User** table very simple—just one row per person linked to their Clerk ID. The roles are handled by an Enum.
The most important part is the **Batch** system. I used join tables for `BatchTrainer` and `BatchStudent` because, in a real scenario, a trainer might teach more than one batch, and a student might be enrolled in multiple courses.

### The Stack
*   **Next.js 15**: I used the new App Router because it makes handling role-based redirects much easier on the server side.
*   **Clerk**: Honestly, I used Clerk because building a secure, multi-role auth system from scratch is risky for a short project. It handles all the password hashing and session security for me.
*   **Railway & Vercel**: I chose Railway for the backend because it handles Prisma/Node deployments very smoothly compared to other platforms.

## 🚧 Status Report
*   **Working**: Everything in the requirements is fully functional. You can sign up, select a role, create batches, generate invite codes, join as a student, and mark attendance. The dashboards also show live percentages for each role.
*   **Skipped**: I didn't include a QR code scanner for attendance because it's hard to test on a laptop during a demo. I went with a unique "Invite Code" system instead which is much more reliable for a web app.

## ⏳ If I had more time...
I would add a "Check-in Window." Right now, a student can mark attendance at any time. I'd like to make it so the Trainer has to "Open" the attendance for a specific 15-minute window during the class to make it more realistic.

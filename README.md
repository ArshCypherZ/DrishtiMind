# DrishtiMind

Drishti is a web app designed to help you gain new perspectives on life's challenges. With AI-powered insights, mood tracking, journaling, and personalized guidance, Drishti supports your mental wellness journey.

---

## Features

- **Mood Tracking:** Log your mood daily and view trends
- **AI Perspective Sessions:** Get fresh perspectives and take interactive quizzes
- **Journaling:** Secure, private journaling with AI summaries
- **Reminders:** Smart notifications to keep you on track
- **Personal Analytics:** See your wellness stats and trends
- **Modern UI:** Responsive, glassmorphism-inspired design

---

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth:** Custom JWT authentication
- **AI:** Google Gemini API
- **Deploy:** Vercel

---

## Quick Start

1. **Clone & Install**
   ```bash
   git clone <repository-url>
   cd drishti-app
   npm install
   ```

2. **Set Up Environment**
   - Copy `.env.example` to `.env.local` and fill in:
     - `DATABASE_URL=postgres`
     - `JWT_SECRET`
     - `GEMINI_API_KEY`
     - `NEXT_PUBLIC_APP_URL=yournextappurl`
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=dashboard.clerk.com`
     - `CLERK_SECRET_KEY=dashboard.clerk.com`

3. **Database**
   - Use local PostgreSQL or a cloud provider (Neon, Supabase, Railway, Vercel Postgres)
   - Run:
     ```bash
     npm run db:generate
     npm run db:migrate
     ```

4. **Start the App**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000)

---
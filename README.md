# DrishtiMind

A private mental wellness toolkit for Indian youth to reframe daily stress. Built with AI to help develop emotional resilience and communication skills through structured exercises.
<img width="1687" height="916" alt="image" src="https://github.com/user-attachments/assets/c331d90b-09c3-468c-9871-c12ad7d64e25" />

## Features

- **Perspective Sessions**: Analyze thought patterns and get alternative viewpoints on stressful situations through interactive questions and perspective cards
- **AI Chatbot**: Explore insights and apply perspective cards to real situations
- **Voice Practice Rooms**: Rehearse difficult conversations with AI voice interactions powered by Gemini Multimodal Live.
- **Mood Tracking**: Daily mood logging with trend visualization and analytics
- **Private Journaling**: Secure space with AI summaries, mood detection, and auto-tagging
- **Dashboard**: Wellness score, mood trends, activity metrics, and journal insights in one view
- **Email Checkups**: Daily, weekly, and monthly wellness reports via automated workflows

This is a self-help tool, not a replacement for therapy or medical advice.

---

## Tech Stack

### Frontend
- **Next.js**: The React framework for production.
- **React**: For building the user interface.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **Framer Motion**: For fluid animations and interactive UI.

### Backend & Database
- **Next.js API Routes**: For serverless backend logic.
- **Prisma**: A next-generation ORM for database access.
- **PostgreSQL**: For robust and scalable data storage.
- **Clerk**: For user authentication and management.
- **Google Gemini API**: Powering the perspective and planning modules.

---

## Setup

Requires Node.js 18+, PostgreSQL, Python 3.8+, Google Gemini API key, Clerk account, and SendGrid/Resend API key.

```bash
git clone https://github.com/ArshCypherZ/DrishtiMind.git
cd DrishtiMind
npm install
cp .env.example .env
# Fill in .env with your credentials
npm run db:generate
npm run db:migrate
```

Start voice server:
```bash
cd voice
cp .env.example .env
# fill in your .env values like DAILY_API_KEY from daily.co
pip install -r requirements.txt
python server.py
```

Start dev server:
```bash
npm run dev
```
---
View live demo at https://drishti-751482659887.asia-south1.run.app/
---
You can even view the screenshots of the web-app [here](screens).

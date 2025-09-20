# DrishtiMind

**DrishtiMind** - A confidential mental wellness toolkit designed to help Indian youth gain new perspectives on daily stress. Our AI-powered platform provides structured, private exercises to build emotional resilience and communication skills.

---

## Features

### In Scope
- **AI-Powered Perspective Sessions**: Engage with our 'Thought Analyzer' to identify cognitive patterns and receive a fresh, unbiased perspective on stressful situations.
- **Daily Mood Tracking & Analytics**: Log your mood daily to visualize trends and understand your emotional well-being over time.
- **Confidential Journaling**: A secure and private space for your thoughts, enhanced with AI-powered summaries to help you reflect without sharing your data.
- **AI Communication Planner**: Practice and plan for difficult conversations in a safe, guided environment to build confidence.
- **Personalized Reminders**: Smart, gentle notifications to encourage consistency in your wellness journey.
- **Responsive Design**: Fully optimized for mobile devices and desktops, allowing you to access support anytime, anywhere.

### Out of Scope
- **Crisis Support & Therapy**: DrishtiMind is a self-help toolkit, not a replacement for professional therapy or a crisis intervention service.
- **Medical Advice**: The platform does not provide medical or clinical diagnoses.

### Future Opportunities
- **Deeper Integrations**: Envisioned to seamlessly connect with calendar and health apps to find correlations between daily activities and mood.
- **Guided Meditations**: Potential to generate personalized, guided meditation scripts based on the user's current mood and journal entries.

---

## Challenges We Faced

- **Ensuring AI Safety**: Crafting highly constrained and reliable prompts to prevent the AI from giving harmful or unsolicited advice was our top priority.
- **Maintaining User Privacy**: Architecting the system to ensure all sensitive user data, like journal entries, could be handled with absolute confidentiality.
- **User Engagement Loop**: Designing a compelling and gentle user journey that encourages consistent, daily check-ins without causing pressure.

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

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (local or cloud-hosted via Neon, Supabase, etc.)

## Installation

1. Clone the repository
```bash
git clone https://github.com/ArshCypherZ/DrishtiMind.git
cd DrishtiMind
````

2.  Install dependencies

<!-- end list -->

```bash
npm install
```

3.  Set up environment variables

<!-- end list -->

```bash
cp .env.example .env.local
```

Fill in your environment variables in the `.env.local` file. This will include your database URL, Gemini API key, and Clerk keys.

4.  Set up the database

<!-- end list -->

```bash
npm run db:generate
npm run db:migrate
```

## Usage

1.  Start the development server

<!-- end list -->

```bash
npm run dev
```

2.  Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser

-----

## Try It Out

  - [Live Demo](https://drishtimind.vercel.app/)

<!-- end list -->

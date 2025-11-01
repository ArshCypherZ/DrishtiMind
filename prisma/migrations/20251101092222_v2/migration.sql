-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_preferences" JSONB DEFAULT '{"weekly_summary": true, "monthly_summary": true, "milestones": true, "daily_reminders": false}',
ADD COLUMN     "monthly_summary" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "daily_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "day" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "mood_emoji" TEXT,
    "mood_rate" INTEGER,
    "happiness_score" DOUBLE PRECISION NOT NULL,
    "sadness_score" DOUBLE PRECISION NOT NULL,
    "anxiety_score" DOUBLE PRECISION NOT NULL,
    "energy_score" DOUBLE PRECISION NOT NULL,
    "loneliness_score" DOUBLE PRECISION NOT NULL,
    "overall_wellness" DOUBLE PRECISION NOT NULL,
    "ai_summary" TEXT NOT NULL,
    "key_insights" JSONB,
    "journal_count" INTEGER NOT NULL DEFAULT 0,
    "perspective_count" INTEGER NOT NULL DEFAULT 0,
    "mood_ids" TEXT[],
    "journal_ids" TEXT[],
    "session_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "week_end" TIMESTAMP(3) NOT NULL,
    "week" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "avg_mood_emoji" TEXT,
    "avg_mood_rate" DOUBLE PRECISION,
    "overall_wellness_score" DOUBLE PRECISION,
    "total_journals" INTEGER NOT NULL DEFAULT 0,
    "total_perspective_sessions" INTEGER NOT NULL DEFAULT 0,
    "total_mood_entries" INTEGER NOT NULL DEFAULT 0,
    "dominant_theme" TEXT,
    "growth_insights" JSONB,
    "achievement_highlights" TEXT[],
    "challenges_faced" TEXT[],
    "ai_summary" TEXT NOT NULL,
    "short_summary" TEXT NOT NULL,
    "detailed_summary" TEXT NOT NULL,
    "recommendations" JSONB,
    "journal_ids" TEXT[],
    "session_ids" TEXT[],
    "mood_ids" TEXT[],
    "daily_summary_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month_start" TIMESTAMP(3) NOT NULL,
    "month_end" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "avg_mood_emoji" TEXT,
    "avg_mood_rate" DOUBLE PRECISION,
    "overall_wellness_score" DOUBLE PRECISION,
    "total_journals" INTEGER NOT NULL DEFAULT 0,
    "total_perspective_sessions" INTEGER NOT NULL DEFAULT 0,
    "total_mood_entries" INTEGER NOT NULL DEFAULT 0,
    "total_weekly_summaries" INTEGER NOT NULL DEFAULT 0,
    "dominant_theme" TEXT,
    "growth_insights" JSONB,
    "achievement_highlights" TEXT[],
    "challenges_faced" TEXT[],
    "ai_summary" TEXT NOT NULL,
    "short_summary" TEXT NOT NULL,
    "detailed_summary" TEXT NOT NULL,
    "recommendations" JSONB,
    "weekly_summary_ids" TEXT[],
    "journal_ids" TEXT[],
    "session_ids" TEXT[],
    "mood_ids" TEXT[],
    "daily_summary_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_summaries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_summaries" ADD CONSTRAINT "weekly_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_summaries" ADD CONSTRAINT "monthly_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

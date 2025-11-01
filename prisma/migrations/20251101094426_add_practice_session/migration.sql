-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "perspective_session_id" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "persona_traits" TEXT[],
    "goal" TEXT NOT NULL,
    "context" TEXT,
    "room_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_perspective_session_id_fkey" FOREIGN KEY ("perspective_session_id") REFERENCES "perspective_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

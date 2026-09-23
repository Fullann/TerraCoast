-- Mode Salon / Party Multijoueur en direct (Style Kahoot)
-- Tables pour persister les salons, joueurs et scores

CREATE TABLE IF NOT EXISTS public.party_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  host_pseudo text NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'question', 'round_reveal', 'podium', 'finished', 'cancelled')),
  current_question_index integer NOT NULL DEFAULT 0,
  time_limit_seconds integer NOT NULL DEFAULT 15,
  question_start_time timestamptz,
  settings jsonb NOT NULL DEFAULT '{"autoAdvance": true, "showLeaderboardEachRound": true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS party_rooms_code_idx ON public.party_rooms (code);
CREATE INDEX IF NOT EXISTS party_rooms_status_idx ON public.party_rooms (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.party_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.party_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_id text NOT NULL,
  pseudo text NOT NULL,
  avatar_url text,
  score integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  is_host boolean NOT NULL DEFAULT false,
  is_connected boolean NOT NULL DEFAULT true,
  last_answer_correct boolean,
  last_answer_time_ms integer,
  last_points_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, guest_id)
);

CREATE INDEX IF NOT EXISTS party_players_room_idx ON public.party_players (room_id, score DESC);

-- Enable RLS
ALTER TABLE public.party_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_players ENABLE ROW LEVEL SECURITY;

-- Policies for party_rooms
DROP POLICY IF EXISTS "Public can view active party rooms" ON public.party_rooms;
CREATE POLICY "Public can view active party rooms"
ON public.party_rooms FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create party rooms" ON public.party_rooms;
CREATE POLICY "Authenticated users can create party rooms"
ON public.party_rooms FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Host can update party room" ON public.party_rooms;
CREATE POLICY "Host can update party room"
ON public.party_rooms FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policies for party_players
DROP POLICY IF EXISTS "Public can view party players" ON public.party_players;
CREATE POLICY "Public can view party players"
ON public.party_players FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Public can join as party player" ON public.party_players;
CREATE POLICY "Public can join as party player"
ON public.party_players FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update own party player" ON public.party_players;
CREATE POLICY "Public can update own party player"
ON public.party_players FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

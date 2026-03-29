-- Admin-defined quiz location for map/globe placement.
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS location_lat double precision,
ADD COLUMN IF NOT EXISTS location_lng double precision;

ALTER TABLE public.quizzes
ADD CONSTRAINT quizzes_location_lat_range
CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90));

ALTER TABLE public.quizzes
ADD CONSTRAINT quizzes_location_lng_range
CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180));

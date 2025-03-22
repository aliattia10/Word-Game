/*
  # Create game rooms table

  1. New Tables
    - `game_rooms`
      - `id` (text, primary key)
      - `host` (text)
      - `players` (jsonb array)
      - `status` (text)
      - `current_letter` (text)
      - `current_round` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `game_rooms` table
    - Add policies for public access (since this is a simple game)
*/

CREATE TABLE IF NOT EXISTS game_rooms (
  id text PRIMARY KEY,
  host text NOT NULL,
  players jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'waiting',
  current_letter text,
  current_round integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Allow public access for this simple game implementation
CREATE POLICY "Allow public access"
  ON game_rooms
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
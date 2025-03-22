# WordSprint - Real-time Word Game

A multiplayer word game where players compete to come up with words starting with a given letter in different categories.

## Features

- Real-time multiplayer gameplay
- Beautiful UI with animations
- Score tracking
- Timer-based rounds
- Host controls for game management

## Tech Stack

- React + TypeScript
- Vite
- Supabase (Real-time database)
- Framer Motion
- TailwindCSS

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Option 1: Deploy to Vercel (Recommended)

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and sign up/login
3. Click "New Project"
4. Import your GitHub repository
5. Add the following environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click "Deploy"

### Option 2: Deploy to Netlify

1. Push your code to a GitHub repository
2. Go to [Netlify](https://netlify.com) and sign up/login
3. Click "New site from Git"
4. Choose your repository
5. Add the following environment variables in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click "Deploy site"

## Supabase Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Go to Project Settings > API
3. Copy the "Project URL" and "anon public" key
4. Add these to your environment variables
5. Run the SQL migration in `supabase/migrations/20250321071114_navy_sunset.sql`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT 
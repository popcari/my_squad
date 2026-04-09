# My Squad

A full-stack team management application for football/soccer squads. Manage players, positions, traits, match schedules, lineups, and scores.

## Tech Stack

### Frontend (`/client`)

| Category     | Technology                     |
| ------------ | ------------------------------ |
| Framework    | Next.js 16 (App Router)        |
| UI Library   | React 19                       |
| Language     | TypeScript 5                   |
| Styling      | Tailwind CSS 4                 |
| Testing      | Vitest + React Testing Library |
| Code Quality | ESLint 9 + Prettier 3          |
| Deployment   | Vercel                         |

### Backend (`/server`)

| Category       | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | NestJS 11                           |
| Language       | TypeScript 5                        |
| Database       | Firebase Firestore (Admin SDK)      |
| Authentication | Firebase Auth                       |
| File Upload    | Cloudinary + Multer                 |
| Validation     | class-validator + class-transformer |
| Testing        | Jest 30 + Supertest                 |
| Code Quality   | ESLint 9 + Prettier 3               |
| Deployment     | Render                              |

## Project Structure

```
my_squad/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (auth, theme, confirm)
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API service layer
│   │   └── types/          # TypeScript interfaces
│   └── package.json
│
├── server/                 # NestJS backend
│   ├── src/
│   │   ├── config/         # Firebase & Cloudinary config
│   │   ├── common/         # Shared middleware, guards, utils
│   │   └── modules/        # Feature modules
│   │       ├── users/
│   │       ├── positions/
│   │       ├── traits/
│   │       ├── user-positions/
│   │       ├── user-traits/
│   │       ├── matches/
│   │       ├── match-lineups/
│   │       ├── match-goals/
│   │       ├── upload/
│   │       ├── auth/
│   │       └── team-settings/
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project with Firestore & Auth enabled
- Cloudinary account

### Server Setup

```bash
cd server
npm install or yarn install
cp .env.example .env  # Configure your environment variables
npm run start:dev or yarn dev
```

### Client Setup

```bash
cd client
npm install or yarn install
cp .env.example .env  # Configure your environment variables
npm run dev or yarn dev
```

### Seed data (admin player)

```bash
cd client
npm run seed or yarn seed
```

### Running Tests

```bash
# Server (Jest)
cd server && npm test

# Client (Vitest)
cd client && npm test
```

### Code Formatting

```bash
# Server
cd server && npm run format or yarn format

# Client
cd client && npm run format or yarn format
```

## Deployment

| Service | Platform | URL |
| ------- | -------- | --- |
| Client  | Vercel   |
| Server  | Render   |

# Classified Marketplace Platform

A multi-platform classified marketplace application built with React Native (mobile), React + Vite (web), and Supabase backend.

## Project Structure

```
classified-marketplace/
├── packages/
│   ├── mobile/          # React Native mobile app (Expo)
│   ├── web/             # React + Vite web app
│   └── shared/          # Shared types and utilities
├── .kiro/               # Kiro specs and configuration
└── package.json         # Root package.json (monorepo)
```

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (for mobile development)
- Supabase account and project

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

#### Web Application
Copy `packages/web/.env.example` to `packages/web/.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Mobile Application
Copy `packages/mobile/.env.example` to `packages/mobile/.env` and fill in your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Servers

#### Web Application
```bash
npm run dev:web
```
The web app will be available at http://localhost:3000

#### Mobile Application
```bash
npm run dev:mobile
```
Then use Expo Go app on your device or an emulator to view the app.

## Available Scripts

- `npm run dev:web` - Start web development server
- `npm run dev:mobile` - Start mobile development server
- `npm run build:web` - Build web application for production
- `npm run build:mobile` - Build mobile application
- `npm run lint` - Run ESLint on all packages
- `npm run format` - Format code with Prettier

## Technology Stack

### Frontend
- **Mobile**: React Native with Expo
- **Web**: React 18 + Vite + TypeScript
- **UI Components**: shadcn/ui (web), React Native Paper (mobile)
- **Routing**: Expo Router (mobile), React Router (web)

### Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### Development Tools
- **Monorepo**: npm workspaces
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript

## Project Features

- User authentication (email/password and social login)
- Listing creation and management
- Category-based browsing
- Search and filtering
- In-app messaging
- User analytics dashboard
- Admin moderation tools
- User management

## Development Guidelines

- Follow the ESLint and Prettier configurations
- Use TypeScript for type safety
- Share common types and utilities in the `shared` package
- Keep platform-specific code in respective packages
- Write tests for critical functionality

## License

Private - All rights reserved

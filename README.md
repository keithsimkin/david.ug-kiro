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

### 2. Set Up Supabase Backend

**Quick Setup (Recommended):**

Windows (PowerShell):
```powershell
.\scripts\setup-supabase.ps1
```

macOS/Linux:
```bash
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh
```

This will:
- Start Supabase locally
- Create database schema
- Seed initial data
- Generate TypeScript types
- Display connection credentials

**Manual Setup:**

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

### 3. Configure Environment Variables

After Supabase is running, copy the credentials to your environment files:

#### Web Application
```bash
cp packages/web/.env.example packages/web/.env
```

Update `packages/web/.env` with your Supabase credentials from `supabase status`:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase_status
```

#### Mobile Application
```bash
cp packages/mobile/.env.example packages/mobile/.env
```

Update `packages/mobile/.env` with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase_status
```

### 4. Run Development Servers

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

### Application Scripts
- `npm run dev:web` - Start web development server
- `npm run dev:mobile` - Start mobile development server
- `npm run build:web` - Build web application for production
- `npm run build:mobile` - Build mobile application
- `npm run lint` - Run ESLint on all packages
- `npm run format` - Format code with Prettier

### Supabase Scripts
- `supabase start` - Start local Supabase instance
- `supabase stop` - Stop local Supabase instance
- `supabase status` - View connection details
- `supabase db reset` - Reset database and reapply migrations
- `supabase studio` - Open Supabase Studio (http://localhost:54323)

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
- Use Supabase Studio for database management and testing
- Generate TypeScript types after schema changes: `supabase gen types typescript --local`

## Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md) - Complete backend setup instructions
- [Database Documentation](./supabase/README.md) - Schema details and API reference
- [SQL Reference](./supabase/SQL_REFERENCE.md) - Common queries and examples
- [Setup Instructions](./SETUP.md) - Detailed project setup guide

## License

Private - All rights reserved

# Setup Guide

## Initial Setup

Follow these steps to set up the development environment:

### 1. Install Dependencies

From the root directory, run:

```bash
npm install
```

This will install dependencies for all packages in the monorepo.

### 2. Configure Supabase

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from the project settings
3. Set up environment variables (see below)

### 3. Environment Variables

#### Web Application

Create `packages/web/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Mobile Application

Create `packages/mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Mobile Assets (Optional)

For the mobile app to run properly, you may need to add placeholder images to `packages/mobile/assets/`:
- `icon.png` (1024x1024)
- `splash.png` (1284x2778)
- `adaptive-icon.png` (1024x1024)
- `favicon.png` (48x48)

You can use placeholder images initially and replace them later.

### 5. Start Development

#### Web Application
```bash
npm run dev:web
```
Access at: http://localhost:3000

#### Mobile Application
```bash
npm run dev:mobile
```
Then scan the QR code with Expo Go app on your device.

## Troubleshooting

### Module Resolution Issues

If you encounter module resolution issues with the shared package:

1. Clear all node_modules:
   ```bash
   rm -rf node_modules packages/*/node_modules
   ```

2. Reinstall:
   ```bash
   npm install
   ```

### Metro Bundler Issues (Mobile)

If Metro bundler has issues finding modules:

```bash
cd packages/mobile
npx expo start --clear
```

### TypeScript Errors

If you see TypeScript errors about missing types:

```bash
npm install
```

This ensures all TypeScript definitions are properly installed.

## Next Steps

After setup is complete, proceed to task 2 in the implementation plan to set up the Supabase backend infrastructure.

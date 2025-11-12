# Supabase Setup Script for Windows PowerShell
# This script helps set up Supabase for local development

Write-Host "🚀 Classified Marketplace - Supabase Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it first:"
    Write-Host "  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    Write-Host "  scoop install supabase"
    Write-Host ""
    Write-Host "Visit: https://supabase.com/docs/guides/cli"
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop and try again"
    exit 1
}

Write-Host ""

# Start Supabase
Write-Host "📦 Starting Supabase local instance..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
Write-Host ""

supabase start

Write-Host ""
Write-Host "✅ Supabase started successfully!" -ForegroundColor Green
Write-Host ""

# Apply migrations
Write-Host "📝 Applying database migrations..." -ForegroundColor Yellow
supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres

Write-Host ""
Write-Host "✅ Migrations applied!" -ForegroundColor Green
Write-Host ""

# Generate TypeScript types
Write-Host "🔧 Generating TypeScript types..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "packages/shared/src/types" | Out-Null
supabase gen types typescript --local | Out-File -FilePath "packages/shared/src/types/database.ts" -Encoding UTF8

Write-Host ""
Write-Host "✅ TypeScript types generated!" -ForegroundColor Green
Write-Host ""

# Get connection details
Write-Host "📋 Connection Details:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
supabase status

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Open Supabase Studio: http://localhost:54323"
Write-Host "2. Update your .env files with the credentials above"
Write-Host "3. Start your development servers"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  supabase stop          - Stop Supabase"
Write-Host "  supabase status        - View status"
Write-Host "  supabase db reset      - Reset database"
Write-Host ""

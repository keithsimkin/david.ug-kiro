#!/bin/bash

# Supabase Setup Script
# This script helps set up Supabase for local development

set -e

echo "🚀 Classified Marketplace - Supabase Setup"
echo "=========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo ""
    echo "Please install it first:"
    echo "  macOS:   brew install supabase/tap/supabase"
    echo "  Windows: scoop install supabase"
    echo "  Linux:   brew install supabase/tap/supabase"
    echo ""
    echo "Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    echo ""
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start Supabase
echo "📦 Starting Supabase local instance..."
echo "This may take a few minutes on first run..."
echo ""

supabase start

echo ""
echo "✅ Supabase started successfully!"
echo ""

# Apply migrations
echo "📝 Applying database migrations..."
supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres

echo ""
echo "✅ Migrations applied!"
echo ""

# Generate TypeScript types
echo "🔧 Generating TypeScript types..."
mkdir -p packages/shared/src/types
supabase gen types typescript --local > packages/shared/src/types/database.ts

echo ""
echo "✅ TypeScript types generated!"
echo ""

# Get connection details
echo "📋 Connection Details:"
echo "====================="
supabase status

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Supabase Studio: http://localhost:54323"
echo "2. Update your .env files with the credentials above"
echo "3. Start your development servers"
echo ""
echo "Useful commands:"
echo "  supabase stop          - Stop Supabase"
echo "  supabase status        - View status"
echo "  supabase db reset      - Reset database"
echo ""

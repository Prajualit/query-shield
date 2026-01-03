# B2B SaaS Migration Script (Windows)
# This script helps migrate the Query Shield database to support B2B features

Write-Host "🚀 Query Shield B2B Migration Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the server directory" -ForegroundColor Red
    Write-Host "   cd server" -ForegroundColor Yellow
    Write-Host "   .\scripts\migrate-b2b.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Pre-migration checklist:" -ForegroundColor Yellow
Write-Host "1. Backup your database before proceeding"
Write-Host "2. Ensure PostgreSQL is running"
Write-Host "3. Review the schema changes in prisma/schema.prisma"
Write-Host ""

$backupConfirm = Read-Host "Have you backed up your database? (yes/no)"

if ($backupConfirm -ne "yes") {
    Write-Host "⚠️  Please backup your database before proceeding" -ForegroundColor Yellow
    Write-Host "   You can use: pg_dump -U postgres -d query_shield > backup.sql" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "🔄 Step 1: Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generate failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prisma Client generated" -ForegroundColor Green
Write-Host ""

Write-Host "🔄 Step 2: Creating database migration..." -ForegroundColor Cyan
npx prisma migrate dev --name add_b2b_features

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    Write-Host "   Please check your database connection and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Migration completed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "🔄 Step 3: Verifying migration..." -ForegroundColor Cyan
npx prisma migrate status

Write-Host ""
Write-Host "✅ B2B Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the new API endpoints"
Write-Host "2. Update your frontend to use the new authentication flow"
Write-Host "3. Review the implementation guide at Documentation/B2B_IMPLEMENTATION_GUIDE.md"
Write-Host ""
Write-Host "🧪 Test the implementation:" -ForegroundColor Cyan
Write-Host "   npm run dev"
Write-Host "   Then try registering with an organization account"
Write-Host ""

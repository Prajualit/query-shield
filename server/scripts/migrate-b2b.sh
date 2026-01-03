#!/bin/bash

# B2B SaaS Migration Script
# This script helps migrate the Query Shield database to support B2B features

echo "🚀 Query Shield B2B Migration Script"
echo "======================================"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the server directory"
    echo "   cd server && npm run migrate:b2b"
    exit 1
fi

echo "📋 Pre-migration checklist:"
echo "1. Backup your database before proceeding"
echo "2. Ensure PostgreSQL is running"
echo "3. Review the schema changes in prisma/schema.prisma"
echo ""

read -p "Have you backed up your database? (yes/no): " backup_confirm

if [ "$backup_confirm" != "yes" ]; then
    echo "⚠️  Please backup your database before proceeding"
    echo "   You can use: pg_dump -U postgres -d query_shield > backup.sql"
    exit 1
fi

echo ""
echo "🔄 Step 1: Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed"
    exit 1
fi

echo "✅ Prisma Client generated"
echo ""

echo "🔄 Step 2: Creating database migration..."
npx prisma migrate dev --name add_b2b_features

if [ $? -ne 0 ]; then
    echo "❌ Migration failed"
    echo "   Please check your database connection and try again"
    exit 1
fi

echo "✅ Migration completed successfully"
echo ""

echo "🔄 Step 3: Verifying migration..."
npx prisma migrate status

echo ""
echo "✅ B2B Migration Complete!"
echo ""
echo "📝 Next steps:"
echo "1. Test the new API endpoints"
echo "2. Update your frontend to use the new authentication flow"
echo "3. Review the implementation guide at Documentation/B2B_IMPLEMENTATION_GUIDE.md"
echo ""
echo "🧪 Test the implementation:"
echo "   npm run dev"
echo "   Then try registering with an organization account"
echo ""

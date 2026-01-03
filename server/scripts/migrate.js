#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL not found in .env file');
  process.exit(1);
}

console.log('Running Prisma migration...');
console.log('Database:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

try {
  // Generate Prisma Client
  console.log('\nGenerating Prisma Client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });

  // Push schema to database
  console.log('\nPushing schema to database...');
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });

  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}

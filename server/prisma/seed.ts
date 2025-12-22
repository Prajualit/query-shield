/**
 * Database Seed Script
 * Populates the database with sample data for testing
 */

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting database seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'demo@queryshield.com' },
    update: {},
    create: {
      email: 'demo@queryshield.com',
      password: hashedPassword,
      name: 'Demo User',
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'admin@queryshield.com' },
    update: {},
    create: {
      email: 'admin@queryshield.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('✓ Created users');

  // Create firewalls
  const firewall1 = await prisma.firewall.upsert({
    where: { id: 'firewall-1' },
    update: {},
    create: {
      id: 'firewall-1',
      name: 'General Protection',
      description: 'Protects against common sensitive data leaks',
      isActive: true,
      userId: user1.id,
    },
  });

  const firewall2 = await prisma.firewall.upsert({
    where: { id: 'firewall-2' },
    update: {},
    create: {
      id: 'firewall-2',
      name: 'PCI Compliance',
      description: 'Focused on credit card and payment data protection',
      isActive: true,
      userId: user1.id,
    },
  });

  console.log('✓ Created firewalls');

  // Create rules for firewall1
  await prisma.rule.createMany({
    data: [
      {
        name: 'Block Email Addresses',
        type: 'EMAIL',
        pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
        action: 'REDACT',
        priority: 10,
        isActive: true,
        firewallId: firewall1.id,
      },
      {
        name: 'Block Phone Numbers',
        type: 'PHONE',
        pattern: '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b',
        action: 'REDACT',
        priority: 9,
        isActive: true,
        firewallId: firewall1.id,
      },
      {
        name: 'Block SSN',
        type: 'SSN',
        pattern: '\\b\\d{3}[-\\s]?\\d{2}[-\\s]?\\d{4}\\b',
        action: 'BLOCK',
        priority: 15,
        isActive: true,
        firewallId: firewall1.id,
      },
      {
        name: 'Mask API Keys',
        type: 'API_KEY',
        pattern: 'sk-[A-Za-z0-9]{48}',
        action: 'MASK',
        priority: 12,
        isActive: true,
        firewallId: firewall1.id,
      },
    ],
    skipDuplicates: true,
  });

  // Create rules for firewall2
  await prisma.rule.createMany({
    data: [
      {
        name: 'Block Credit Cards',
        type: 'CREDIT_CARD',
        pattern: '\\b4\\d{3}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
        action: 'BLOCK',
        priority: 20,
        isActive: true,
        firewallId: firewall2.id,
      },
      {
        name: 'Redact Card Numbers',
        type: 'CREDIT_CARD',
        pattern: '\\b5[1-5]\\d{2}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
        action: 'REDACT',
        priority: 18,
        isActive: true,
        firewallId: firewall2.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✓ Created rules');

  // Create sample audit logs
  await prisma.auditLog.create({
    data: {
      userId: user1.id,
      firewallId: firewall1.id,
      inputText: 'My email is john@example.com and my phone is 555-123-4567',
      sanitizedText: 'My email is [REDACTED:EMAIL] and my phone is [REDACTED:PHONE]',
      detectedIssues: [
        {
          type: 'EMAIL',
          value: 'john@example.com',
          startIndex: 12,
          endIndex: 29,
          confidence: 95,
        },
        {
          type: 'PHONE',
          value: '555-123-4567',
          startIndex: 47,
          endIndex: 59,
          confidence: 90,
        },
      ],
      action: 'REDACTED',
      aiProvider: 'OpenAI',
    },
  });

  console.log('✓ Created audit logs');

  console.log('\n✓ Database seeded successfully!');
  console.log('\nTest Users:');
  console.log('  Email: demo@queryshield.com');
  console.log('  Password: Password123!');
  console.log('\n  Email: admin@queryshield.com');
  console.log('  Password: Password123!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

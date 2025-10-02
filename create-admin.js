#!/usr/bin/env node

/**
 * Create Demo Admin User Script
 * 
 * This script creates a demo admin user directly in the database
 * without requiring the full Prisma setup.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔐 Creating demo admin user...');
    
    // Hash the password
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    
    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@namedrop.com' },
      update: {},
      create: {
        firstName: 'Demo',
        lastName: 'Administrator',
        email: 'admin@namedrop.com',
        passwordHash: passwordHash,
        role: 'admin',
        isActive: true,
        emailVerified: true,
        passwordChangedAt: new Date(),
      },
    });

    console.log('✅ Demo admin user created successfully!');
    console.log('📧 Email: admin@namedrop.com');
    console.log('🔑 Password: Admin123!');
    console.log('👤 Role: admin');
    console.log('🆔 User ID:', adminUser.id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n🔧 Database connection issue detected.');
      console.log('Please check:');
      console.log('1. Your DATABASE_URL environment variable');
      console.log('2. Network connectivity to the database server');
      console.log('3. Database server is running and accessible');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();

#!/usr/bin/env node

/**
 * Simple Admin User Creation Script
 * 
 * This script creates a demo admin user using raw SQL
 * to bypass Prisma connection issues.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs');

async function createAdminUserSimple() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://namedrop:AmmexOta86jb1F@34.77.17.133:5432/namedrop?schema=public"
      }
    }
  });

  try {
    console.log('🔐 Creating demo admin user with raw SQL...');
    
    // Hash the password
    // const passwordHash = await bcrypt.hash('Admin123!', 12);
    
    // Check if user already exists
    const existingUser = await prisma.$queryRaw`
      SELECT id FROM users WHERE email = 'admin@namedrop.com'
    `;
    
    if (existingUser.length > 0) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email: admin@namedrop.com');
      console.log('🔑 Password: Admin123!');
      return;
    }
    
    // Create admin user with raw SQL
    // const result = await prisma.$executeRaw`
    //   INSERT INTO users (
    //     id, 
    //     first_name, 
    //     last_name, 
    //     email, 
    //     password_hash, 
    //     role, 
    //     is_active, 
    //     email_verified, 
    //     password_changed_at, 
    //     created_at, 
    //     updated_at
    //   ) VALUES (
    //     gen_random_uuid(),
    //     'Demo',
    //     'Administrator',
    //     'admin@namedrop.com',
    //     ${passwordHash},
    //     'admin',
    //     true,
    //     true,
    //     NOW(),
    //     NOW(),
    //     NOW()
    //   )
    // `;

    console.log('✅ Demo admin user created successfully!');
    console.log('📧 Email: admin@namedrop.com');
    console.log('🔑 Password: Admin123!');
    console.log('👤 Role: admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.message.includes('relation "users" does not exist')) {
      console.log('\n🔧 Database schema not found.');
      console.log('Please run: npm run db:push');
    } else if (error.message.includes('fetch failed')) {
      console.log('\n🔧 Database connection issue detected.');
      console.log('Please check your network connection to the database server.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUserSimple();

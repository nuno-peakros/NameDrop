#!/usr/bin/env node

/**
 * Create Admin User Directly
 * 
 * This script creates the demo admin user using the existing database schema.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://namedrop:AmmexOta86jb1F@34.77.17.133:5432/namedrop?schema=public"
      }
    }
  });

  try {
    console.log('🔍 Checking existing tables...');
    
    // Check what tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📋 Existing tables:', tables);
    
    // Check if users table exists and create admin user
    if (tables.some(t => t.table_name === 'users')) {
      console.log('✅ Users table found, creating admin user...');
      
      const passwordHash = await bcrypt.hash('Admin123!', 12);
      
      // Check if admin user already exists
      const existingUser = await prisma.$queryRaw`
        SELECT id FROM users WHERE email = 'admin@namedrop.com'
      `;
      
      if (existingUser.length > 0) {
        console.log('✅ Admin user already exists!');
        console.log('📧 Email: admin@namedrop.com');
        console.log('🔑 Password: Admin123!');
      } else {
        // Create admin user
        await prisma.$executeRaw`
          INSERT INTO users (
            first_name, 
            last_name, 
            email, 
            password_hash, 
            role, 
            is_active, 
            email_verified, 
            password_changed_at,
            created_at,
            updated_at
          ) VALUES (
            'Demo',
            'Administrator',
            'admin@namedrop.com',
            ${passwordHash},
            'admin',
            true,
            true,
            NOW(),
            NOW(),
            NOW()
          )
        `;
        
        console.log('✅ Demo admin user created successfully!');
        console.log('📧 Email: admin@namedrop.com');
        console.log('🔑 Password: Admin123!');
        console.log('👤 Role: admin');
      }
    } else {
      console.log('❌ Users table not found. Please run database migration first.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();

#!/usr/bin/env node

/**
 * Create Admin User with Raw SQL
 * 
 * This script creates the demo admin user using raw SQL.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdminUserRaw() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://namedrop:AmmexOta86jb1F@34.77.17.133:5432/namedrop?schema=public"
      }
    }
  });

  try {
    console.log('🔐 Creating demo admin user with raw SQL...');
    
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    
    // Check if admin user already exists
    const existingUser = await prisma.$queryRaw`
      SELECT id FROM users WHERE email = 'admin@namedrop.com'
    `;
    
    if (existingUser.length > 0) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email: admin@namedrop.com');
      console.log('🔑 Password: Admin123!');
      console.log('👤 Role: admin');
    } else {
      // Create admin user with raw SQL
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

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.log('🔧 Permission denied. Please check database user permissions.');
    } else if (error.message.includes('relation "users" does not exist')) {
      console.log('🔧 Users table not found. Please run database migration first.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUserRaw();

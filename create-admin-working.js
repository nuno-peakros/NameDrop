#!/usr/bin/env node

/**
 * Create Admin User - Working Version
 * 
 * This script creates the demo admin user using the working credentials.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://nuno:H9gt78hw!!%%@34.77.17.133:5432/namedrop?schema=public"
      }
    }
  });

  try {
    console.log('🔐 Creating demo admin user...');
    
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
      
      // Verify the user was created
      const newUser = await prisma.$queryRaw`
        SELECT id, first_name, last_name, email, role, is_active, email_verified 
        FROM users 
        WHERE email = 'admin@namedrop.com'
      `;
      
      console.log('👤 Created user details:', newUser[0]);
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();

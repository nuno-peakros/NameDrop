#!/usr/bin/env node

/**
 * Create Admin User with Original Credentials
 * 
 * This script tries to create the demo admin user using the original database credentials.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdminUserOriginal() {
  // Try with the original credentials first
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://nuno:H9gt78hw!!%%@34.77.17.133:5432/namedrop?schema=public"
      }
    }
  });

  try {
    console.log('🔐 Creating demo admin user with original credentials...');
    
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
    console.error('❌ Error with original credentials:', error.message);
    
    // Try with new credentials
    console.log('🔄 Trying with new credentials...');
    
    const prismaNew = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://namedrop:AmmexOta86jb1F@34.77.17.133:5432/namedrop?schema=public"
        }
      }
    });
    
    try {
      const passwordHash = await bcrypt.hash('Admin123!', 12);
      
      await prismaNew.$executeRaw`
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
      
      console.log('✅ Demo admin user created with new credentials!');
      console.log('📧 Email: admin@namedrop.com');
      console.log('🔑 Password: Admin123!');
      console.log('👤 Role: admin');
      
    } catch (newError) {
      console.error('❌ Error with new credentials:', newError.message);
    } finally {
      await prismaNew.$disconnect();
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUserOriginal();

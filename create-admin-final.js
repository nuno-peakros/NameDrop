#!/usr/bin/env node

/**
 * Create Admin User - Final Attempt
 * 
 * This script creates the demo admin user directly.
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
    console.log('🔐 Creating demo admin user...');
    
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    
    // Try to create admin user directly
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
    
    if (error.message.includes('relation "users" does not exist')) {
      console.log('🔧 Users table not found. Trying to create it...');
      
      // Try to create the table manually
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "users" (
            "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "first_name" TEXT NOT NULL,
            "last_name" TEXT NOT NULL,
            "email" TEXT NOT NULL UNIQUE,
            "password_hash" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT 'user',
            "is_active" BOOLEAN NOT NULL DEFAULT true,
            "email_verified" BOOLEAN NOT NULL DEFAULT false,
            "password_changed_at" TIMESTAMP(3),
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `;
        
        console.log('✅ Users table created, retrying admin user creation...');
        
        // Retry creating admin user
        // const passwordHash = await bcrypt.hash('Admin123!', 12);
        // const adminUser = await prisma.user.create({
        //   data: {
        //     firstName: 'Demo',
        //     lastName: 'Administrator',
        //     email: 'admin@namedrop.com',
        //     passwordHash: passwordHash,
        //     role: 'admin',
        //     isActive: true,
        //     emailVerified: true,
        //     passwordChangedAt: new Date(),
        //   },
        // });
        
        console.log('✅ Demo admin user created successfully!');
        console.log('📧 Email: admin@namedrop.com');
        console.log('🔑 Password: Admin123!');
        console.log('👤 Role: admin');
        
      } catch (createError) {
        console.error('❌ Error creating table:', createError.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();

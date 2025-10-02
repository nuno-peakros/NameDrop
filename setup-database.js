#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script creates the database schema and admin user
 * using raw SQL commands.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://namedrop:AmmexOta86jb1F@34.77.17.133:5432/namedrop?schema=public"
      }
    }
  });

  try {
    console.log('🏗️  Setting up database schema...');
    
    // Set schema and create UserRole enum
    await prisma.$executeRaw`SET search_path TO public;`;
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create users table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "first_name" TEXT NOT NULL,
        "last_name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "password_hash" TEXT NOT NULL,
        "role" "UserRole" NOT NULL DEFAULT 'user',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "email_verified" BOOLEAN NOT NULL DEFAULT false,
        "password_changed_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create password_reset_tokens table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "user_id" TEXT NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "used_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `;

    // Create user_sessions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "user_id" TEXT NOT NULL,
        "session_token" TEXT NOT NULL UNIQUE,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `;

    console.log('✅ Database schema created successfully!');

    // Create admin user
    console.log('🔐 Creating demo admin user...');
    
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    
    // Check if admin user already exists
    const existingUser = await prisma.$queryRaw`
      SELECT id FROM users WHERE email = 'admin@namedrop.com'
    `;
    
    if (existingUser.length > 0) {
      console.log('✅ Admin user already exists!');
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
          password_changed_at
        ) VALUES (
          'Demo',
          'Administrator',
          'admin@namedrop.com',
          ${passwordHash},
          'admin',
          true,
          true,
          NOW()
        )
      `;
      
      console.log('✅ Demo admin user created successfully!');
    }

    console.log('\n🎉 Database setup completed!');
    console.log('📧 Admin Email: admin@namedrop.com');
    console.log('🔑 Admin Password: Admin123!');
    console.log('👤 Role: admin');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDatabase();

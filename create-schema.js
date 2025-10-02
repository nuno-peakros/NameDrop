#!/usr/bin/env node

/**
 * Create Database Schema Script
 * 
 * This script creates the database schema step by step.
 */

const { PrismaClient } = require('@prisma/client');

async function createSchema() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://namedrop:AmmexOta86jb1F@34.77.17.133:5432/namedrop?schema=public"
      }
    }
  });

  try {
    console.log('🏗️  Creating database schema...');
    
    // Create public schema if it doesn't exist
    await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS public;`;
    console.log('✅ Schema created');
    
    // Set search path
    await prisma.$executeRaw`SET search_path TO public;`;
    console.log('✅ Search path set');
    
    // Create UserRole enum
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('✅ UserRole enum created');
    
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
    console.log('✅ Users table created');
    
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
    console.log('✅ Password reset tokens table created');
    
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
    console.log('✅ User sessions table created');

    console.log('\n🎉 Database schema created successfully!');

  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSchema();

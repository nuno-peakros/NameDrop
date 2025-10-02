#!/usr/bin/env node

/**
 * Check Table Structure
 */

const { PrismaClient } = require('@prisma/client');

async function checkTableStructure() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://nuno:H9gt78hw!!%%@34.77.17.133:5432/namedrop?schema=public"
      }
    }
  });

  try {
    console.log('🔍 Checking users table structure...');
    
    // Get table structure
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Users table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Check if gen_random_uuid() function exists
    try {
      const uuidTest = await prisma.$queryRaw`SELECT gen_random_uuid() as test_uuid`;
      console.log('✅ gen_random_uuid() function works:', uuidTest[0].test_uuid);
    } catch (uuidError) {
      console.log('❌ gen_random_uuid() function error:', uuidError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkTableStructure();

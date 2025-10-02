#!/usr/bin/env node

/**
 * Query Database with Original Credentials
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

async function queryDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://nuno:H9gt78hw!!%%@34.77.17.133:5432/namedrop?schema=public"
      }
    }
  });

  try {
    console.log('🔍 Querying database with original credentials...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check current database
    const currentDb = await prisma.$queryRaw`SELECT current_database()`;
    console.log('📊 Current database:', currentDb[0].current_database);
    
    // Check current schema
    const currentSchema = await prisma.$queryRaw`SELECT current_schema()`;
    console.log('📊 Current schema:', currentSchema[0].current_schema);
    
    // List all schemas
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `;
    console.log('📋 Available schemas:', schemas);
    
    // List tables in public schema
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📋 Tables in public schema:', tables);
    
    // Try to query users table directly
    try {
      const users = await prisma.$queryRaw`SELECT * FROM users LIMIT 5`;
      console.log('👥 Users in database:', users);
    } catch (userError) {
      console.log('❌ Cannot query users table:', userError.message);
    }
    
    // Check if we can see any tables at all
    const allTables = await prisma.$queryRaw`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY table_schema, table_name
    `;
    console.log('📋 All accessible tables:', allTables);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
queryDatabase();

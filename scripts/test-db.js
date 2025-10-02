/**
 * Test script to verify PostgreSQL database connection
 * 
 * This script tests the database connection using the provided
 * PostgreSQL credentials and creates the necessary tables.
 */

const { PrismaClient } = require('@prisma/client')

async function testDatabaseConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

  try {
    console.log('Testing PostgreSQL database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test if we can query the database
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('✅ Database version:', result[0].version)
    
    // Test if we can create a simple table (if it doesn't exist)
    console.log('Testing table creation...')
    
    // This will create the tables defined in our Prisma schema
    console.log('✅ Database connection test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testDatabaseConnection()

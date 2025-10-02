#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps set up the database for NameDrop by:
 * - Generating Prisma client
 * - Running database migrations
 * - Seeding initial data
 * - Verifying database connection
 * 
 * Usage:
 *   node scripts/setup-database.js [options]
 * 
 * Options:
 *   --reset     Reset database and run all migrations
 *   --seed-only Only run seeding (skip migrations)
 *   --check     Only check database connection
 * 
 * @example
 * ```bash
 * # Full setup
 * node scripts/setup-database.js
 * 
 * # Reset and setup
 * node scripts/setup-database.js --reset
 * 
 * # Only seed data
 * node scripts/setup-database.js --seed-only
 * ```
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');
const seedOnly = args.includes('--seed-only');
const checkOnly = args.includes('--check');

/**
 * Executes a command and handles errors
 * @param {string} command - Command to execute
 * @param {string} description - Description of what the command does
 */
function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

/**
 * Checks if database connection is working
 */
function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  try {
    runCommand('npx prisma db pull --schema-only', 'Database connection test');
    console.log('✅ Database connection successful');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
    console.error('❌ Database connection failed');
    console.error('Please check your DATABASE_URL environment variable');
    process.exit(1);
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 NameDrop Database Setup');
  console.log('==========================\n');

  try {
    // Check database connection first
    checkDatabaseConnection();

    if (checkOnly) {
      console.log('✅ Database check completed successfully');
      return;
    }

    if (shouldReset) {
      console.log('⚠️  Resetting database...');
      runCommand('npm run db:reset', 'Database reset');
    }

    if (!seedOnly) {
      // Generate Prisma client
      runCommand('npm run db:generate', 'Prisma client generation');

      // Run migrations
      if (shouldReset) {
        runCommand('npm run db:migrate:deploy', 'Database migrations');
      } else {
        runCommand('npm run db:push', 'Database schema push');
      }
    }

    // Seed database
    runCommand('npm run db:seed', 'Database seeding');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Visit http://localhost:3000');
    console.log('3. Login with admin@namedrop.com / Admin123!');
    console.log('4. Explore the admin dashboard');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your DATABASE_URL environment variable');
    console.log('2. Ensure PostgreSQL is running and accessible');
    console.log('3. Verify database credentials and permissions');
    console.log('4. Check the logs above for specific error details');
    process.exit(1);
  }
}

// Run the setup
main();
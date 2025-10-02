import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seeds the database with initial data for development and testing
 * 
 * This function creates:
 * - Initial admin user for system access
 * - Sample users for testing different scenarios
 * - Test data for development purposes
 * 
 * @throws {Error} When database operations fail
 * @example
 * ```bash
 * npx prisma db seed
 * ```
 */
async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create initial admin user
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@namedrop.com' },
      update: {},
      create: {
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@namedrop.com',
        passwordHash: adminPassword,
        role: UserRole.admin,
        isActive: true,
        emailVerified: true,
        passwordChangedAt: new Date(),
      },
    });

    console.log('✅ Admin user created:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    // Create sample users for testing
    const sampleUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: UserRole.user,
        isActive: true,
        emailVerified: true,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        role: UserRole.user,
        isActive: true,
        emailVerified: false, // Unverified user
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        role: UserRole.user,
        isActive: false, // Inactive user
        emailVerified: true,
      },
      {
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice.williams@example.com',
        role: UserRole.user,
        isActive: true,
        emailVerified: true,
      },
    ];

    const tempPassword = await bcrypt.hash('TempPass123!', 12);

    for (const userData of sampleUsers) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          ...userData,
          passwordHash: tempPassword,
          passwordChangedAt: userData.emailVerified ? new Date() : null,
        },
      });

      console.log(`✅ Sample user created: ${user.email} (${user.role})`);
    }

    // Create some test sessions for active users
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true, emailVerified: true },
    });

    for (const user of activeUsers.slice(0, 2)) { // Create sessions for first 2 active users
      const sessionToken = generateSecureToken(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken,
          expiresAt,
        },
      });

      console.log(`✅ Session created for user: ${user.email}`);
    }

    // Create some expired password reset tokens for testing
    const testUsers = await prisma.user.findMany({
      where: { emailVerified: false },
    });

    for (const user of testUsers.slice(0, 1)) {
      const token = generateSecureToken(32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() - 1); // Expired 1 hour ago

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      console.log(`✅ Expired reset token created for user: ${user.email}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Admin user: admin@namedrop.com (password: Admin123!)');
    console.log('- Sample users: 4 users with different states');
    console.log('- Test sessions: 2 active sessions');
    console.log('- Test tokens: 1 expired password reset token');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Generates a cryptographically secure random token
 * @param length - Length of the token in characters
 * @returns Secure random token string
 */
function generateSecureToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomBytes = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
}

// Run the seeding function
main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

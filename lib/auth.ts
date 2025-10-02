import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from '@/lib/db'
import { config } from '@/lib/config'
import bcrypt from 'bcryptjs'
// import { User } from '@prisma/client' // Unused import

// Type for user without password hash
// type UserWithoutPassword = Omit<User, 'passwordHash'> // Unused type

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    isActive: boolean
    emailVerified: boolean | Date | null
    passwordChangedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }
  
  interface Session {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      role: string
      emailVerified: boolean
      passwordChangedAt: Date | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    emailVerified: boolean | Date | null
    passwordChangedAt: Date | null
  }
}

/**
 * NextAuth.js configuration for NameDrop authentication
 * 
 * This configuration handles:
 * - Credentials-based authentication
 * - JWT token management
 * - Session handling
 * - User validation
 * 
 * @example
 * ```typescript
 * import { authOptions } from '@/lib/auth';
 * 
 * // Use in API routes
 * export default NextAuth(authOptions);
 * ```
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      
      /**
       * Authorize user with email and password
       * @param credentials - User credentials
       * @returns User object if valid, null if invalid
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const user = await db.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            return null
          }

          // Check if user is active
          if (!user.isActive) {
            return null
          }

          // Check if email is verified
          if (!user.emailVerified) {
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (!isValidPassword) {
            return null
          }

          // Return user without password hash
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { passwordHash: _passwordHash, ...userWithoutPassword } = user
          return userWithoutPassword
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  jwt: {
    secret: config.auth.jwtSecret,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    /**
     * JWT callback - called when JWT is created or updated
     * @param token - JWT token
     * @param user - User object (only on sign in)
     * @returns Updated JWT token
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.emailVerified = !!user.emailVerified
        token.passwordChangedAt = user.passwordChangedAt
      }
      return token
    },

    /**
     * Session callback - called when session is accessed
     * @param session - Session object
     * @param token - JWT token
     * @returns Updated session object
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified as boolean
        session.user.passwordChangedAt = token.passwordChangedAt as Date | null
      }
      return session
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  secret: config.auth.nextAuthSecret,
}

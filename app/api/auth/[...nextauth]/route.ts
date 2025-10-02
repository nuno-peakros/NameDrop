import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * NextAuth.js API route handler
 * 
 * This route handles all NextAuth.js authentication requests including:
 * - POST /api/auth/signin
 * - POST /api/auth/signout
 * - GET /api/auth/session
 * - POST /api/auth/csrf
 * - GET /api/auth/providers
 * - GET /api/auth/callback/[provider]
 * 
 * @example
 * ```typescript
 * // Client-side usage
 * import { signIn, signOut, useSession } from 'next-auth/react';
 * 
 * const { data: session } = useSession();
 * await signIn('credentials', { email, password });
 * await signOut();
 * ```
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

import { NextRequest, NextResponse } from 'next/server'

// Use Node.js runtime instead of Edge runtime
export const runtime = 'nodejs'

/**
 * GET /api/demo-users
 * 
 * Demo users endpoint that returns mock data without authentication
 * for testing purposes
 */
export async function GET(request: NextRequest) {
  try {
    // Mock users data
    const mockUsers = {
      users: [
        {
          id: 'demo-admin-123',
          firstName: 'Demo',
          lastName: 'Administrator',
          email: 'admin@namedrop.com',
          role: 'admin',
          isActive: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
        {
          id: 'demo-user-456',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'user',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          lastLoginAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          id: 'demo-user-789',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          role: 'user',
          isActive: false,
          emailVerified: false,
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          lastLoginAt: null,
        },
        {
          id: 'demo-user-101',
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          role: 'user',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          lastLoginAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        },
        {
          id: 'demo-user-102',
          firstName: 'Alice',
          lastName: 'Williams',
          email: 'alice@example.com',
          role: 'admin',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
          lastLoginAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 5,
        totalPages: 1,
      },
    }
    
    return NextResponse.json(
      {
        success: true,
        data: mockUsers,
        message: 'Demo users retrieved successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Demo users endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching demo users',
        },
      },
      { status: 500 }
    )
  }
}

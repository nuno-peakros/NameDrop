#!/usr/bin/env node

/**
 * Create Demo JWT Token
 * 
 * This script creates a valid JWT token for demo purposes
 * without requiring database access.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');

// Demo admin user data
const demoAdminUser = {
  id: 'demo-admin-123',
  email: 'admin@namedrop.com',
  role: 'admin',
  emailVerified: true,
  passwordChangedAt: new Date().toISOString(),
};

// JWT secret (should match your app's secret)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

function createDemoToken() {
  try {
    console.log('🔐 Creating demo JWT token...');
    
    // Create token payload
    const payload = {
      id: demoAdminUser.id,
      email: demoAdminUser.email,
      role: demoAdminUser.role,
      emailVerified: demoAdminUser.emailVerified,
      passwordChangedAt: demoAdminUser.passwordChangedAt,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: 'HS256',
    });

    console.log('✅ Demo JWT token created successfully!');
    console.log('🔑 Token:', token);
    console.log('📧 Email: admin@namedrop.com');
    console.log('👤 Role: admin');
    console.log('⏰ Expires: 7 days from now');
    console.log('');
    console.log('💡 To use this token:');
    console.log('1. Open browser developer tools');
    console.log('2. Go to Application/Storage > Local Storage');
    console.log('3. Set key: auth-token');
    console.log('4. Set value:', token);
    console.log('5. Refresh the page');

    return token;
  } catch (error) {
    console.error('❌ Error creating demo token:', error.message);
    return null;
  }
}

// Run the script
const token = createDemoToken();

if (token) {
  // Also try to set it in localStorage if running in browser context
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('auth-token', token);
    console.log('✅ Token automatically set in localStorage');
  }
}

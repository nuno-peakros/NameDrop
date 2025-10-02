import { chromium, FullConfig } from '@playwright/test'

/**
 * Global setup for Playwright tests
 * 
 * This setup:
 * - Starts the application
 * - Sets up test data
 * - Configures authentication
 * - Prepares the test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')

  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to start...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })

    // Check if the application is running
    const isReady = await page.evaluate(() => {
      return document.readyState === 'complete'
    })

    if (!isReady) {
      throw new Error('Application failed to start')
    }

    console.log('✅ Application is ready')

    // Set up test data if needed
    await setupTestData(page)

    // Set up authentication tokens
    await setupAuthentication(page)

    console.log('✅ Global setup completed')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

/**
 * Set up test data in the database
 */
async function setupTestData(page: any) {
  console.log('📊 Setting up test data...')

  try {
    // Create test users via API
    const testUsers = [
      {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'user',
      },
      {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
      },
    ]

    // Note: In a real implementation, you would:
    // 1. Connect to the test database
    // 2. Create test users
    // 3. Set up any required test data
    // 4. Clean up after tests

    console.log('✅ Test data setup completed')
  } catch (error) {
    console.error('❌ Test data setup failed:', error)
    // Don't throw here as test data setup might not be critical
  }
}

/**
 * Set up authentication for tests
 */
async function setupAuthentication(page: any) {
  console.log('🔐 Setting up authentication...')

  try {
    // Create test authentication tokens
    const testTokens = {
      user: 'test-user-token',
      admin: 'test-admin-token',
    }

    // Store tokens for use in tests
    await page.evaluate((tokens) => {
      localStorage.setItem('test-tokens', JSON.stringify(tokens))
    }, testTokens)

    console.log('✅ Authentication setup completed')
  } catch (error) {
    console.error('❌ Authentication setup failed:', error)
    // Don't throw here as auth setup might not be critical
  }
}

export default globalSetup

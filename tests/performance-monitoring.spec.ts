/**
 * Performance monitoring E2E tests
 * 
 * Tests for:
 * - Performance metrics display
 * - Real-time updates
 * - Performance score calculation
 * - Bundle size information
 */

import { test, expect } from '@playwright/test'

test.describe('Performance Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to performance page
    await page.goto('/dashboard/performance')
  })

  test('should display performance metrics', async ({ page }) => {
    // Check if performance monitor is visible
    await expect(page.getByText('Core Web Vitals')).toBeVisible()
    await expect(page.getByText('Bundle Size')).toBeVisible()
    await expect(page.getByText('Performance Score')).toBeVisible()
  })

  test('should display performance tips', async ({ page }) => {
    // Check if performance tips are visible
    await expect(page.getByText('Performance Tips')).toBeVisible()
    await expect(page.getByText('Optimize Images')).toBeVisible()
    await expect(page.getByText('Code Splitting')).toBeVisible()
    await expect(page.getByText('Caching')).toBeVisible()
    await expect(page.getByText('Lazy Loading')).toBeVisible()
  })

  test('should display performance standards', async ({ page }) => {
    // Check if performance standards are visible
    await expect(page.getByText('Performance Standards')).toBeVisible()
    await expect(page.getByText('FCP')).toBeVisible()
    await expect(page.getByText('LCP')).toBeVisible()
    await expect(page.getByText('FID')).toBeVisible()
    await expect(page.getByText('CLS')).toBeVisible()
  })

  test('should show refresh button', async ({ page }) => {
    // Check if refresh button is visible
    await expect(page.getByText('Refresh Metrics')).toBeVisible()
  })

  test('should refresh metrics when button is clicked', async ({ page }) => {
    // Click refresh button
    await page.getByText('Refresh Metrics').click()
    
    // Wait for page to reload
    await page.waitForLoadState('networkidle')
    
    // Check if metrics are still visible
    await expect(page.getByText('Core Web Vitals')).toBeVisible()
  })

  test('should display performance score', async ({ page }) => {
    // Check if performance score is displayed
    await expect(page.getByText('Based on Core Web Vitals')).toBeVisible()
    
    // Check if score is a valid grade
    const scoreElement = page.locator('text=/^[A-F][+]?$/').first()
    await expect(scoreElement).toBeVisible()
  })

  test('should display bundle size information', async ({ page }) => {
    // Check if bundle size information is displayed
    await expect(page.getByText('JavaScript')).toBeVisible()
    await expect(page.getByText('CSS')).toBeVisible()
    await expect(page.getByText('Total')).toBeVisible()
  })

  test('should handle unsupported environment gracefully', async ({ page }) => {
    // Mock unsupported environment
    await page.addInitScript(() => {
      // @ts-ignore
      delete window.performance
      // @ts-ignore
      delete window.PerformanceObserver
    })
    
    // Reload page
    await page.reload()
    
    // Check if unsupported message is displayed
    await expect(page.getByText('Performance monitoring is not supported in this environment.')).toBeVisible()
  })

  test('should update metrics in real-time', async ({ page }) => {
    // Wait for initial metrics to load
    await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 5000 })
    
    // Check if metrics are displayed
    await expect(page.getByText('Core Web Vitals')).toBeVisible()
    
    // Wait for potential updates (metrics update every 5 seconds)
    await page.waitForTimeout(6000)
    
    // Check if metrics are still visible after update
    await expect(page.getByText('Core Web Vitals')).toBeVisible()
  })

  test('should display performance recommendations', async ({ page }) => {
    // Check if performance recommendations are displayed
    await expect(page.getByText('Performance Tips')).toBeVisible()
    
    // Check for specific recommendations
    const recommendations = [
      'Optimize Images',
      'Code Splitting',
      'Caching',
      'Lazy Loading'
    ]
    
    for (const recommendation of recommendations) {
      await expect(page.getByText(recommendation)).toBeVisible()
    }
  })

  test('should show performance thresholds', async ({ page }) => {
    // Check if performance thresholds are displayed
    await expect(page.getByText('≤ 1.8s')).toBeVisible() // FCP
    await expect(page.getByText('≤ 2.5s')).toBeVisible() // LCP
    await expect(page.getByText('≤ 100ms')).toBeVisible() // FID
    await expect(page.getByText('≤ 0.1')).toBeVisible() // CLS
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if performance monitor is still visible
    await expect(page.getByText('Core Web Vitals')).toBeVisible()
    await expect(page.getByText('Bundle Size')).toBeVisible()
    await expect(page.getByText('Performance Score')).toBeVisible()
  })

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Check if performance monitor is still visible
    await expect(page.getByText('Core Web Vitals')).toBeVisible()
    await expect(page.getByText('Bundle Size')).toBeVisible()
    await expect(page.getByText('Performance Score')).toBeVisible()
  })

  test('should be accessible', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.getByRole('heading', { name: 'Performance Monitor' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Core Web Vitals' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Bundle Size' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Performance Score' })).toBeVisible()
    
    // Check for proper button accessibility
    const refreshButton = page.getByText('Refresh Metrics')
    await expect(refreshButton).toBeVisible()
    await expect(refreshButton).toHaveAttribute('type', 'button')
  })
})

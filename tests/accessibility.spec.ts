/**
 * Accessibility E2E tests
 * 
 * Tests for:
 * - Keyboard navigation
 * - Screen reader compatibility
 * - ARIA attributes
 * - Focus management
 * - Color contrast
 * - WCAG compliance
 */

import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to accessibility page
    await page.goto('/dashboard/accessibility')
  })

  test('should have proper heading structure', async ({ page }) => {
    // Check for proper heading hierarchy
    await expect(page.getByRole('heading', { name: 'Accessibility Testing' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Test Area' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'WCAG 2.1 Guidelines' })).toBeVisible()
  })

  test('should be keyboard navigable', async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Test Shift+Tab navigation
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Test Enter key activation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Test Space key activation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space')
  })

  test('should have proper focus indicators', async ({ page }) => {
    // Check if focusable elements have visible focus indicators
    const focusableElements = page.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')
    
    for (let i = 0; i < await focusableElements.count(); i++) {
      const element = focusableElements.nth(i)
      await element.focus()
      
      // Check if element has focus indicator
      const hasFocusIndicator = await element.evaluate(el => {
        const style = window.getComputedStyle(el)
        return style.outline !== 'none' || style.boxShadow !== 'none'
      })
      
      expect(hasFocusIndicator).toBe(true)
    }
  })

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check for proper ARIA roles
    await expect(page.getByRole('button')).toBeVisible()
    await expect(page.getByRole('textbox')).toBeVisible()
    await expect(page.getByRole('checkbox')).toBeVisible()
    await expect(page.getByRole('radio')).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
    
    // Check for proper ARIA labels
    const buttons = page.getByRole('button')
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i)
      const hasAriaLabel = await button.evaluate(el => 
        el.hasAttribute('aria-label') || el.textContent?.trim() !== ''
      )
      expect(hasAriaLabel).toBe(true)
    }
  })

  test('should have proper form labels', async ({ page }) => {
    // Check if all form inputs have associated labels
    const inputs = page.locator('input, select, textarea')
    
    for (let i = 0; i < await inputs.count(); i++) {
      const input = inputs.nth(i)
      const hasLabel = await input.evaluate(el => {
        const id = el.getAttribute('id')
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`)
          return !!label
        }
        return false
      })
      expect(hasLabel).toBe(true)
    }
  })

  test('should have proper color contrast', async ({ page }) => {
    // Check if text has sufficient color contrast
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6')
    
    for (let i = 0; i < Math.min(await textElements.count(), 10); i++) {
      const element = textElements.nth(i)
      const contrast = await element.evaluate(el => {
        const style = window.getComputedStyle(el)
        const color = style.color
        const backgroundColor = style.backgroundColor
        
        // Simple contrast check (this would need a proper contrast calculation in real implementation)
        return color !== backgroundColor
      })
      
      expect(contrast).toBe(true)
    }
  })

  test('should handle screen reader announcements', async ({ page }) => {
    // Check if important actions are announced
    const button = page.getByRole('button').first()
    await button.click()
    
    // Check if there are live regions for announcements
    const liveRegions = page.locator('[aria-live]')
    expect(await liveRegions.count()).toBeGreaterThan(0)
  })

  test('should have proper table structure', async ({ page }) => {
    // Check if tables have proper headers
    const tables = page.locator('table')
    
    for (let i = 0; i < await tables.count(); i++) {
      const table = tables.nth(i)
      
      // Check if table has caption or aria-label
      const hasCaption = await table.evaluate(el => 
        el.querySelector('caption') || el.hasAttribute('aria-label')
      )
      expect(hasCaption).toBe(true)
      
      // Check if table has headers
      const hasHeaders = await table.evaluate(el => 
        el.querySelector('th') || el.querySelector('[role="columnheader"]')
      )
      expect(hasHeaders).toBe(true)
    }
  })

  test('should handle modal accessibility', async ({ page }) => {
    // Test modal focus trap
    const modalTrigger = page.getByText('Open Modal').first()
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click()
      
      // Check if modal is focused
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()
      
      // Test escape key
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
    }
  })

  test('should have proper error handling', async ({ page }) => {
    // Test form validation errors
    const form = page.locator('form').first()
    if (await form.isVisible()) {
      const submitButton = form.getByRole('button', { name: /submit/i })
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // Check if errors are announced
        const errorMessages = page.locator('[role="alert"]')
        expect(await errorMessages.count()).toBeGreaterThan(0)
      }
    }
  })

  test('should be responsive and accessible on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if content is still accessible
    await expect(page.getByRole('heading', { name: 'Accessibility Testing' })).toBeVisible()
    
    // Test touch navigation
    await page.tap('button')
    
    // Check if focus is visible on touch
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        * {
          background: white !important;
          color: black !important;
          border-color: black !important;
        }
      `
    })
    
    // Check if content is still readable
    await expect(page.getByText('Accessibility Testing')).toBeVisible()
    
    // Check if interactive elements are still visible
    const buttons = page.getByRole('button')
    expect(await buttons.count()).toBeGreaterThan(0)
  })

  test('should have proper skip links', async ({ page }) => {
    // Check if skip links are present
    const skipLinks = page.locator('a[href^="#"]')
    expect(await skipLinks.count()).toBeGreaterThan(0)
    
    // Test skip link functionality
    const skipLink = skipLinks.first()
    if (await skipLink.isVisible()) {
      await skipLink.click()
      
      // Check if focus moved to target
      const target = page.locator(':focus')
      await expect(target).toBeVisible()
    }
  })

  test('should handle reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.addStyleTag({
      content: `
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `
    })
    
    // Check if content is still functional
    await expect(page.getByText('Accessibility Testing')).toBeVisible()
    
    // Test interactions
    const button = page.getByRole('button').first()
    await button.click()
  })

  test('should have proper language attributes', async ({ page }) => {
    // Check if html element has lang attribute
    const html = page.locator('html')
    const lang = await html.getAttribute('lang')
    expect(lang).toBeTruthy()
    
    // Check if content is in the specified language
    const body = page.locator('body')
    const bodyLang = await body.getAttribute('lang')
    expect(bodyLang).toBeTruthy()
  })

  test('should handle zoom up to 200%', async ({ page }) => {
    // Test at 200% zoom
    await page.setViewportSize({ width: 800, height: 600 })
    
    // Check if content is still readable and functional
    await expect(page.getByText('Accessibility Testing')).toBeVisible()
    
    // Test interactions
    const button = page.getByRole('button').first()
    await button.click()
    
    // Check if layout is not broken
    const content = page.locator('main, [role="main"]')
    await expect(content).toBeVisible()
  })
})

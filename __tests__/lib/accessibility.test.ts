/**
 * Accessibility utilities tests
 * 
 * Tests for:
 * - ARIA attribute helpers
 * - Focus management utilities
 * - Screen reader support
 * - Keyboard navigation helpers
 * - Color contrast validation
 * - Accessibility testing utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ARIA_ROLES,
  ARIA_STATES,
  FocusManager,
  ScreenReader,
  KeyboardNavigation,
  ColorContrast,
  AccessibilityTester,
  generateAriaId,
  isVisibleToScreenReader,
  getAccessibleName
} from '@/lib/accessibility'

// Mock DOM elements
const createMockElement = (tagName: string, attributes: Record<string, string> = {}) => {
  const element = document.createElement(tagName)
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
  return element
}

describe('Accessibility Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ARIA Constants', () => {
    it('should have correct ARIA roles', () => {
      expect(ARIA_ROLES.BUTTON).toBe('button')
      expect(ARIA_ROLES.LINK).toBe('link')
      expect(ARIA_ROLES.MENU).toBe('menu')
      expect(ARIA_ROLES.DIALOG).toBe('dialog')
    })

    it('should have correct ARIA states', () => {
      expect(ARIA_STATES.EXPANDED).toBe('aria-expanded')
      expect(ARIA_STATES.SELECTED).toBe('aria-selected')
      expect(ARIA_STATES.CHECKED).toBe('aria-checked')
      expect(ARIA_STATES.DISABLED).toBe('aria-disabled')
    })
  })

  describe('FocusManager', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <a href="#">Link</a>
        <button disabled>Disabled Button</button>
        <div tabindex="0">Focusable Div</div>
      `
    })

    it('should get focusable elements', () => {
      const focusable = FocusManager.getFocusableElements(container)
      expect(focusable).toHaveLength(4) // Button 1, input, link, focusable div
    })

    it('should get first focusable element', () => {
      const first = FocusManager.getFirstFocusable(container)
      expect(first?.textContent).toBe('Button 1')
    })

    it('should get last focusable element', () => {
      const last = FocusManager.getLastFocusable(container)
      expect(last?.textContent).toBe('Focusable Div')
    })

    it('should trap focus on Tab key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      // Mock focus on last element
      const lastElement = FocusManager.getLastFocusable(container)!
      const firstElement = FocusManager.getFirstFocusable(container)!
      firstElement.focus = vi.fn()
      
      // Mock document.activeElement
      Object.defineProperty(document, 'activeElement', {
        value: lastElement,
        writable: true,
        configurable: true
      })
      
      FocusManager.trapFocus(container, event)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(firstElement.focus).toHaveBeenCalled()
    })

    it('should trap focus on Shift+Tab key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      // Mock focus on first element
      const firstElement = FocusManager.getFirstFocusable(container)!
      const lastElement = FocusManager.getLastFocusable(container)!
      lastElement.focus = vi.fn()
      
      // Mock document.activeElement
      Object.defineProperty(document, 'activeElement', {
        value: firstElement,
        writable: true,
        configurable: true
      })
      
      FocusManager.trapFocus(container, event)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(lastElement.focus).toHaveBeenCalled()
    })
  })

  describe('ScreenReader', () => {
    beforeEach(() => {
      // Mock document.body
      document.body.innerHTML = ''
    })

    it('should announce message to screen readers', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      // const removeChildSpy = vi.spyOn(document.body, 'removeChild')
      
      ScreenReader.announce('Test message')
      
      expect(appendChildSpy).toHaveBeenCalled()
      
      // Check if announcement element has correct attributes
      const announcement = appendChildSpy.mock.calls[0][0] as HTMLElement
      expect(announcement.getAttribute('aria-live')).toBe('polite')
      expect(announcement.getAttribute('aria-atomic')).toBe('true')
      expect(announcement.textContent).toBe('Test message')
    })

    it('should announce assertive message', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      
      ScreenReader.announce('Error message', 'assertive')
      
      const announcement = appendChildSpy.mock.calls[0][0] as HTMLElement
      expect(announcement.getAttribute('aria-live')).toBe('assertive')
    })

    it('should announce page title change', () => {
      const titleSpy = vi.spyOn(document, 'title', 'set')
      const announceSpy = vi.spyOn(ScreenReader, 'announce')
      
      ScreenReader.announcePageTitle('New Page Title')
      
      expect(titleSpy).toHaveBeenCalledWith('New Page Title')
      expect(announceSpy).toHaveBeenCalledWith('Page title changed to New Page Title')
    })

    it('should announce validation errors', () => {
      const announceSpy = vi.spyOn(ScreenReader, 'announce')
      
      ScreenReader.announceValidationErrors(['Error 1', 'Error 2'])
      
      expect(announceSpy).toHaveBeenCalledWith('Form validation failed: Error 1, Error 2', 'assertive')
    })

    it('should announce success message', () => {
      const announceSpy = vi.spyOn(ScreenReader, 'announce')
      
      ScreenReader.announceSuccess('Operation completed')
      
      expect(announceSpy).toHaveBeenCalledWith('Success: Operation completed')
    })

    it('should announce error message', () => {
      const announceSpy = vi.spyOn(ScreenReader, 'announce')
      
      ScreenReader.announceError('Operation failed')
      
      expect(announceSpy).toHaveBeenCalledWith('Error: Operation failed', 'assertive')
    })
  })

  describe('KeyboardNavigation', () => {
    let container: HTMLElement

    beforeEach(() => {
      container = document.createElement('div')
      container.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      `
    })

    it('should handle horizontal arrow key navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      // Mock focus on first button
      const firstButton = container.querySelector('button')!
      firstButton.focus = vi.fn()
      
      // Mock document.activeElement
      Object.defineProperty(document, 'activeElement', {
        value: firstButton,
        writable: true,
        configurable: true
      })
      
      KeyboardNavigation.handleArrowKeys(event, container, 'horizontal')
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should handle vertical arrow key navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      const firstButton = container.querySelector('button')!
      firstButton.focus = vi.fn()
      
      // Mock document.activeElement
      Object.defineProperty(document, 'activeElement', {
        value: firstButton,
        writable: true,
        configurable: true
      })
      
      KeyboardNavigation.handleArrowKeys(event, container, 'vertical')
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should handle home key navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      const focusFirstSpy = vi.spyOn(FocusManager, 'focusFirst')
      
      KeyboardNavigation.handleHomeEndKeys(event, container)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(focusFirstSpy).toHaveBeenCalledWith(container)
    })

    it('should handle end key navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      const focusLastSpy = vi.spyOn(FocusManager, 'focusLast')
      
      KeyboardNavigation.handleHomeEndKeys(event, container)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(focusLastSpy).toHaveBeenCalledWith(container)
    })

    it('should handle escape key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      const callback = vi.fn()
      
      KeyboardNavigation.handleEscapeKey(event, callback)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
    })

    it('should handle enter key activation', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      const callback = vi.fn()
      
      KeyboardNavigation.handleActivationKeys(event, callback)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
    })

    it('should handle space key activation', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      const callback = vi.fn()
      
      KeyboardNavigation.handleActivationKeys(event, callback)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('ColorContrast', () => {
    it('should calculate relative luminance', () => {
      const luminance = ColorContrast.getRelativeLuminance(255, 255, 255) // White
      expect(luminance).toBeCloseTo(1, 2)
      
      const luminanceBlack = ColorContrast.getRelativeLuminance(0, 0, 0) // Black
      expect(luminanceBlack).toBeCloseTo(0, 2)
    })

    it('should calculate contrast ratio', () => {
      const ratio = ColorContrast.getContrastRatio('#000000', '#ffffff')
      expect(ratio).toBeCloseTo(21, 1) // Black on white should have high contrast
    })

    it('should check WCAG AA compliance', () => {
      const meetsAA = ColorContrast.meetsWCAG('#000000', '#ffffff', 'AA')
      expect(meetsAA).toBe(true)
      
      const meetsAAFail = ColorContrast.meetsWCAG('#999999', '#ffffff', 'AA')
      expect(meetsAAFail).toBe(false)
    })

    it('should check WCAG AAA compliance', () => {
      const meetsAAA = ColorContrast.meetsWCAG('#000000', '#ffffff', 'AAA')
      expect(meetsAAA).toBe(true)
      
      const meetsAAAFail = ColorContrast.meetsWCAG('#666666', '#ffffff', 'AAA')
      expect(meetsAAAFail).toBe(false)
    })

    it('should convert hex to RGB', () => {
      const rgb = ColorContrast.hexToRgb('#ff0000')
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 })
      
      const rgbWithHash = ColorContrast.hexToRgb('#00ff00')
      expect(rgbWithHash).toEqual({ r: 0, g: 255, b: 0 })
    })

    it('should return null for invalid hex', () => {
      const invalid = ColorContrast.hexToRgb('invalid')
      expect(invalid).toBeNull()
    })
  })

  describe('AccessibilityTester', () => {
    it('should check proper ARIA attributes', () => {
      const elementWithARIA = createMockElement('button', { 'role': 'button', 'aria-label': 'Test button' })
      const elementWithoutARIA = createMockElement('button')
      
      expect(AccessibilityTester.hasProperARIA(elementWithARIA)).toBe(true)
      expect(AccessibilityTester.hasProperARIA(elementWithoutARIA)).toBe(false)
    })

    it('should check keyboard accessibility', () => {
      const accessibleElement = createMockElement('button')
      const inaccessibleElement = createMockElement('button', { 'tabindex': '-1' })
      
      expect(AccessibilityTester.isKeyboardAccessible(accessibleElement)).toBe(true)
      expect(AccessibilityTester.isKeyboardAccessible(inaccessibleElement)).toBe(false)
    })

    it('should check focus management', () => {
      const dialog = createMockElement('div', { 'role': 'dialog' })
      dialog.innerHTML = '<button>Close</button>'
      
      const menu = createMockElement('div', { 'role': 'menu' })
      menu.innerHTML = '<div role="menuitem">Item 1</div>'
      
      expect(AccessibilityTester.hasProperFocusManagement(dialog)).toBe(true)
      expect(AccessibilityTester.hasProperFocusManagement(menu)).toBe(true)
    })

    it('should run comprehensive test', () => {
      const element = createMockElement('button', { 'aria-label': 'Test button' })
      const results = AccessibilityTester.testElement(element)
      
      expect(results).toHaveProperty('hasProperARIA')
      expect(results).toHaveProperty('isKeyboardAccessible')
      expect(results).toHaveProperty('hasProperFocusManagement')
      expect(results).toHaveProperty('score')
      expect(typeof results.score).toBe('number')
    })
  })

  describe('Utility Functions', () => {
    it('should generate unique ARIA ID', () => {
      const id1 = generateAriaId('test')
      const id2 = generateAriaId('test')
      
      expect(id1).toMatch(/^test-/)
      expect(id2).toMatch(/^test-/)
      expect(id1).not.toBe(id2)
    })

    it('should check if element is visible to screen readers', () => {
      const visibleElement = createMockElement('div')
      const hiddenElement = createMockElement('div', { 'aria-hidden': 'true' })
      
      // Mock getComputedStyle
      const mockStyle = {
        display: 'block',
        visibility: 'visible',
        opacity: '1'
      }
      
      vi.spyOn(window, 'getComputedStyle').mockReturnValue(mockStyle as CSSStyleDeclaration)
      
      expect(isVisibleToScreenReader(visibleElement)).toBe(true)
      expect(isVisibleToScreenReader(hiddenElement)).toBe(false)
    })

    it('should get accessible name', () => {
      const elementWithLabel = createMockElement('button', { 'aria-label': 'Test button' })
      const elementWithText = createMockElement('button')
      elementWithText.textContent = 'Button text'
      
      expect(getAccessibleName(elementWithLabel)).toBe('Test button')
      expect(getAccessibleName(elementWithText)).toBe('Button text')
    })
  })
})

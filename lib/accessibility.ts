/**
 * Accessibility utilities
 * 
 * This module provides:
 * - ARIA attribute helpers
 * - Focus management utilities
 * - Screen reader support
 * - Keyboard navigation helpers
 * - Color contrast validation
 * - Accessibility testing utilities
 */

/**
 * ARIA roles and properties
 */
export const ARIA_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TABLIST: 'tablist',
  GRID: 'grid',
  ROW: 'row',
  CELL: 'cell',
  COLUMNHEADER: 'columnheader',
  ROWHEADER: 'rowheader',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  TEXTBOX: 'textbox',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  PROGRESSBAR: 'progressbar',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  SWITCH: 'switch',
  TOOLTIP: 'tooltip',
} as const

/**
 * ARIA states and properties
 */
export const ARIA_STATES = {
  EXPANDED: 'aria-expanded',
  SELECTED: 'aria-selected',
  CHECKED: 'aria-checked',
  DISABLED: 'aria-disabled',
  HIDDEN: 'aria-hidden',
  PRESSED: 'aria-pressed',
  INVALID: 'aria-invalid',
  REQUIRED: 'aria-required',
  READONLY: 'aria-readonly',
  MULTILINE: 'aria-multiline',
  AUTOSIZE: 'aria-autosize',
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  CONTROLS: 'aria-controls',
  OWNS: 'aria-owns',
  ACTIVE: 'aria-activedescendant',
  LEVEL: 'aria-level',
  POSINSET: 'aria-posinset',
  SETSIZE: 'aria-setsize',
  ORIENTATION: 'aria-orientation',
  VALUEMIN: 'aria-valuemin',
  VALUEMAX: 'aria-valuemax',
  VALUENOW: 'aria-valuenow',
  VALUETEXT: 'aria-valuetext',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',
  BUSY: 'aria-busy',
  DROPEFFECT: 'aria-dropeffect',
  GRABBED: 'aria-grabbed',
  SORT: 'aria-sort',
  SORTED: 'aria-sorted',
  COLCOUNT: 'aria-colcount',
  ROWCOUNT: 'aria-rowcount',
  COLINDEX: 'aria-colindex',
  ROWINDEX: 'aria-rowindex',
  COLSPAN: 'aria-colspan',
  ROWSPAN: 'aria-rowspan',
} as const

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([aria-disabled="true"])',
    '[role="link"]:not([aria-disabled="true"])',
    '[role="menuitem"]:not([aria-disabled="true"])',
    '[role="tab"]:not([aria-disabled="true"])',
    '[role="option"]:not([aria-disabled="true"])',
  ].join(', ')

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors))
  }

  /**
   * Get the first focusable element
   */
  static getFirstFocusable(container: HTMLElement): HTMLElement | null {
    const focusable = this.getFocusableElements(container)
    return focusable[0] || null
  }

  /**
   * Get the last focusable element
   */
  static getLastFocusable(container: HTMLElement): HTMLElement | null {
    const focusable = this.getFocusableElements(container)
    return focusable[focusable.length - 1] || null
  }

  /**
   * Trap focus within a container
   */
  static trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== 'Tab') return

    const focusable = this.getFocusableElements(container)
    const firstFocusable = focusable[0]
    const lastFocusable = focusable[focusable.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable?.focus()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable?.focus()
      }
    }
  }

  /**
   * Focus the first focusable element
   */
  static focusFirst(container: HTMLElement): void {
    const first = this.getFirstFocusable(container)
    first?.focus()
  }

  /**
   * Focus the last focusable element
   */
  static focusLast(container: HTMLElement): void {
    const last = this.getLastFocusable(container)
    last?.focus()
  }

  /**
   * Focus the next focusable element
   */
  static focusNext(container: HTMLElement, currentElement: HTMLElement): void {
    const focusable = this.getFocusableElements(container)
    const currentIndex = focusable.indexOf(currentElement)
    const nextIndex = (currentIndex + 1) % focusable.length
    focusable[nextIndex]?.focus()
  }

  /**
   * Focus the previous focusable element
   */
  static focusPrevious(container: HTMLElement, currentElement: HTMLElement): void {
    const focusable = this.getFocusableElements(container)
    const currentIndex = focusable.indexOf(currentElement)
    const previousIndex = currentIndex === 0 ? focusable.length - 1 : currentIndex - 1
    focusable[previousIndex]?.focus()
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReader {
  /**
   * Announce a message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * Announce page title change
   */
  static announcePageTitle(title: string): void {
    document.title = title
    this.announce(`Page title changed to ${title}`)
  }

  /**
   * Announce form validation errors
   */
  static announceValidationErrors(errors: string[]): void {
    const message = `Form validation failed: ${errors.join(', ')}`
    this.announce(message, 'assertive')
  }

  /**
   * Announce successful action
   */
  static announceSuccess(message: string): void {
    this.announce(`Success: ${message}`)
  }

  /**
   * Announce error
   */
  static announceError(message: string): void {
    this.announce(`Error: ${message}`, 'assertive')
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation
   */
  static handleArrowKeys(
    event: KeyboardEvent,
    container: HTMLElement,
    orientation: 'horizontal' | 'vertical' = 'horizontal'
  ): void {
    const { key } = event
    const isHorizontal = orientation === 'horizontal'
    const isVertical = orientation === 'vertical'

    if (
      (isHorizontal && (key === 'ArrowLeft' || key === 'ArrowRight')) ||
      (isVertical && (key === 'ArrowUp' || key === 'ArrowDown'))
    ) {
      event.preventDefault()
      
      const focusable = FocusManager.getFocusableElements(container)
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement)
      
      if (currentIndex === -1) return

      let nextIndex: number
      if (key === 'ArrowRight' || key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % focusable.length
      } else {
        nextIndex = currentIndex === 0 ? focusable.length - 1 : currentIndex - 1
      }

      focusable[nextIndex]?.focus()
    }
  }

  /**
   * Handle home/end key navigation
   */
  static handleHomeEndKeys(event: KeyboardEvent, container: HTMLElement): void {
    if (event.key === 'Home') {
      event.preventDefault()
      FocusManager.focusFirst(container)
    } else if (event.key === 'End') {
      event.preventDefault()
      FocusManager.focusLast(container)
    }
  }

  /**
   * Handle escape key
   */
  static handleEscapeKey(event: KeyboardEvent, callback: () => void): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      callback()
    }
  }

  /**
   * Handle enter/space key activation
   */
  static handleActivationKeys(event: KeyboardEvent, callback: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      callback()
    }
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrast {
  /**
   * Calculate relative luminance
   */
  static getRelativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  /**
   * Calculate contrast ratio
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)
    
    if (!rgb1 || !rgb2) return 0

    const lum1 = this.getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
    const lum2 = this.getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)
    
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  /**
   * Check if contrast ratio meets WCAG standards
   */
  static meetsWCAG(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2)
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7
  }

  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
}

/**
 * Accessibility testing utilities
 */
export class AccessibilityTester {
  /**
   * Check if element has proper ARIA attributes
   */
  static hasProperARIA(element: HTMLElement): boolean {
    const role = element.getAttribute('role')
    const ariaLabel = element.getAttribute('aria-label')
    const ariaLabelledBy = element.getAttribute('aria-labelledby')
    // const ariaDescribedBy = element.getAttribute('aria-describedby')
    
    // Check if element has proper labeling
    if (role && !ariaLabel && !ariaLabelledBy) {
      return false
    }
    
    // Check if interactive elements have proper roles
    if (element.tagName === 'BUTTON' && role !== 'button') {
      return false
    }
    
    if (element.tagName === 'A' && role !== 'link') {
      return false
    }
    
    return true
  }

  /**
   * Check if element is keyboard accessible
   */
  static isKeyboardAccessible(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute('tabindex')
    const role = element.getAttribute('role')
    
    // Check if element can receive focus
    if (tabIndex === '-1') {
      return false
    }
    
    // Check if interactive elements are focusable
    if (role === 'button' || role === 'link' || role === 'menuitem') {
      return element.tabIndex >= 0
    }
    
    return true
  }

  /**
   * Check if element has proper focus management
   */
  static hasProperFocusManagement(element: HTMLElement): boolean {
    const role = element.getAttribute('role')
    
    // Check if modal/dialog has proper focus management
    if (role === 'dialog') {
      const focusable = FocusManager.getFocusableElements(element)
      return focusable.length > 0
    }
    
    // Check if menu has proper focus management
    if (role === 'menu') {
      const menuItems = element.querySelectorAll('[role="menuitem"]')
      return menuItems.length > 0
    }
    
    return true
  }

  /**
   * Run comprehensive accessibility test
   */
  static testElement(element: HTMLElement): {
    hasProperARIA: boolean
    isKeyboardAccessible: boolean
    hasProperFocusManagement: boolean
    score: number
  } {
    const hasProperARIA = this.hasProperARIA(element)
    const isKeyboardAccessible = this.isKeyboardAccessible(element)
    const hasProperFocusManagement = this.hasProperFocusManagement(element)
    
    const score = [hasProperARIA, isKeyboardAccessible, hasProperFocusManagement]
      .filter(Boolean).length / 3 * 100
    
    return {
      hasProperARIA,
      isKeyboardAccessible,
      hasProperFocusManagement,
      score
    }
  }
}

/**
 * Accessibility constants
 */
export const ACCESSIBILITY_CONSTANTS = {
  WCAG_AA_CONTRAST_RATIO: 4.5,
  WCAG_AAA_CONTRAST_RATIO: 7,
  FOCUS_VISIBLE_CLASS: 'focus-visible',
  SCREEN_READER_ONLY_CLASS: 'sr-only',
  SKIP_LINK_CLASS: 'skip-link',
} as const

/**
 * Generate unique ID for ARIA attributes
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  const ariaHidden = element.getAttribute('aria-hidden')
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    ariaHidden !== 'true'
  )
}

/**
 * Get accessible name for element
 */
export function getAccessibleName(element: HTMLElement): string {
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel
  
  const ariaLabelledBy = element.getAttribute('aria-labelledby')
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy)
    if (labelElement) return labelElement.textContent || ''
  }
  
  const textContent = element.textContent?.trim()
  if (textContent) return textContent
  
  const alt = element.getAttribute('alt')
  if (alt) return alt
  
  const title = element.getAttribute('title')
  if (title) return title
  
  return ''
}

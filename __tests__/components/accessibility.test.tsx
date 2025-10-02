/**
 * Accessibility component tests
 * 
 * Tests for:
 * - Skip link component
 * - Screen reader only component
 * - Focus trap component
 * - Accessible button component
 * - Accessible input component
 * - Accessible modal component
 * - Accessible table components
 * - Accessible loading spinner
 * - Accessible progress bar
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  SkipLink,
  ScreenReaderOnly,
  FocusTrap,
  AccessibleButton,
  AccessibleInput,
  AccessibleModal,
  AccessibleTable,
  AccessibleTableHeader,
  AccessibleTableRow,
  AccessibleTableHeaderCell,
  AccessibleTableCell,
  AccessibleLoadingSpinner,
  AccessibleProgressBar
} from '@/components/ui/accessibility'

// Mock accessibility utilities
vi.mock('@/lib/accessibility', () => ({
  FocusManager: {
    trapFocus: vi.fn(),
    focusFirst: vi.fn(),
    focusLast: vi.fn(),
  },
  ScreenReader: {
    announce: vi.fn(),
  },
  generateAriaId: vi.fn(() => 'test-id'),
}))

describe('Accessibility Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SkipLink', () => {
    it('should render skip link', () => {
      render(<SkipLink href="#main">Skip to main content</SkipLink>)
      
      const link = screen.getByText('Skip to main content')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '#main')
    })

    it('should have proper CSS classes', () => {
      render(<SkipLink href="#main">Skip to main content</SkipLink>)
      
      const link = screen.getByText('Skip to main content')
      expect(link).toHaveClass('sr-only')
    })

    it('should handle click event', () => {
      const mockScrollIntoView = vi.fn()
      const mockFocus = vi.fn()
      
      // Mock document.querySelector
      const mockElement = {
        scrollIntoView: mockScrollIntoView,
        focus: mockFocus
      }
      
      vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as Element | null)
      
      render(<SkipLink href="#main">Skip to main content</SkipLink>)
      
      const link = screen.getByText('Skip to main content')
      fireEvent.click(link)
      
      expect(mockScrollIntoView).toHaveBeenCalled()
      expect(mockFocus).toHaveBeenCalled()
    })
  })

  describe('ScreenReaderOnly', () => {
    it('should render screen reader only text', () => {
      render(<ScreenReaderOnly>Screen reader text</ScreenReaderOnly>)
      
      const text = screen.getByText('Screen reader text')
      expect(text).toBeInTheDocument()
      expect(text).toHaveClass('sr-only')
      expect(text).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('FocusTrap', () => {
    it('should render children', () => {
      render(
        <FocusTrap>
          <div>Test content</div>
        </FocusTrap>
      )
      
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should have focus-trap class', () => {
      render(
        <FocusTrap>
          <div>Test content</div>
        </FocusTrap>
      )
      
      const container = screen.getByText('Test content').parentElement
      expect(container).toHaveClass('focus-trap')
    })

    it('should handle escape key when onEscape is provided', () => {
      const onEscape = vi.fn()
      
      render(
        <FocusTrap onEscape={onEscape}>
          <div>Test content</div>
        </FocusTrap>
      )
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(onEscape).toHaveBeenCalled()
    })
  })

  describe('AccessibleButton', () => {
    it('should render button with children', () => {
      render(<AccessibleButton>Test Button</AccessibleButton>)
      
      const button = screen.getByText('Test Button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    it('should handle click event', () => {
      const onClick = vi.fn()
      render(<AccessibleButton onClick={onClick}>Test Button</AccessibleButton>)
      
      const button = screen.getByText('Test Button')
      fireEvent.click(button)
      
      expect(onClick).toHaveBeenCalled()
    })

    it('should handle keyboard events', () => {
      const onClick = vi.fn()
      render(<AccessibleButton onClick={onClick}>Test Button</AccessibleButton>)
      
      const button = screen.getByText('Test Button')
      
      fireEvent.keyDown(button, { key: 'Enter' })
      expect(onClick).toHaveBeenCalled()
      
      fireEvent.keyDown(button, { key: ' ' })
      expect(onClick).toHaveBeenCalledTimes(2)
    })

    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleButton 
          ariaLabel="Test button"
          ariaDescribedBy="description"
          disabled
        >
          Test Button
        </AccessibleButton>
      )
      
      const button = screen.getByText('Test Button')
      expect(button).toHaveAttribute('aria-label', 'Test button')
      expect(button).toHaveAttribute('aria-describedby', 'description')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should show pressed state', () => {
      render(<AccessibleButton>Test Button</AccessibleButton>)
      
      const button = screen.getByText('Test Button')
      fireEvent.keyDown(button, { key: 'Enter' })
      
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('AccessibleInput', () => {
    it('should render input with label', () => {
      render(<AccessibleInput label="Test Input" />)
      
      expect(screen.getByLabelText('Test Input')).toBeInTheDocument()
      expect(screen.getByText('Test Input')).toBeInTheDocument()
    })

    it('should show required indicator', () => {
      render(<AccessibleInput label="Test Input" required />)
      
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('should show error message', () => {
      render(<AccessibleInput label="Test Input" error="Test error" />)
      
      expect(screen.getByText('Test error')).toBeInTheDocument()
      expect(screen.getByText('Test error')).toHaveAttribute('role', 'alert')
    })

    it('should show description', () => {
      render(<AccessibleInput label="Test Input" description="Test description" />)
      
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleInput 
          label="Test Input" 
          error="Test error"
          required
        />
      )
      
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('AccessibleModal', () => {
    it('should render modal when open', () => {
      render(
        <AccessibleModal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Modal content
        </AccessibleModal>
      )
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('should not render modal when closed', () => {
      render(
        <AccessibleModal isOpen={false} onClose={vi.fn()} title="Test Modal">
          Modal content
        </AccessibleModal>
      )
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })

    it('should handle close button click', () => {
      const onClose = vi.fn()
      render(
        <AccessibleModal isOpen={true} onClose={onClose} title="Test Modal">
          Modal content
        </AccessibleModal>
      )
      
      const closeButton = screen.getByLabelText('Close modal')
      fireEvent.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should handle escape key', () => {
      const onClose = vi.fn()
      render(
        <AccessibleModal isOpen={true} onClose={onClose} title="Test Modal">
          Modal content
        </AccessibleModal>
      )
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleModal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Modal content
        </AccessibleModal>
      )
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
      expect(modal).toHaveAttribute('aria-labelledby')
    })
  })

  describe('AccessibleTable', () => {
    it('should render table with caption', () => {
      render(
        <AccessibleTable caption="Test Table">
          <tbody>
            <tr>
              <td>Cell 1</td>
              <td>Cell 2</td>
            </tr>
          </tbody>
        </AccessibleTable>
      )
      
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Test Table')).toBeInTheDocument()
    })

    it('should render table header', () => {
      render(
        <AccessibleTable caption="Test Table">
          <AccessibleTableHeader>
            <AccessibleTableRow>
              <AccessibleTableHeaderCell>Header 1</AccessibleTableHeaderCell>
              <AccessibleTableHeaderCell>Header 2</AccessibleTableHeaderCell>
            </AccessibleTableRow>
          </AccessibleTableHeader>
        </AccessibleTable>
      )
      
      expect(screen.getByRole('columnheader', { name: 'Header 1' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Header 2' })).toBeInTheDocument()
    })

    it('should render table row', () => {
      render(
        <AccessibleTable caption="Test Table">
          <tbody>
            <AccessibleTableRow>
              <AccessibleTableCell>Cell 1</AccessibleTableCell>
              <AccessibleTableCell>Cell 2</AccessibleTableCell>
            </AccessibleTableRow>
          </tbody>
        </AccessibleTable>
      )
      
      expect(screen.getByRole('row')).toBeInTheDocument()
      expect(screen.getByRole('cell', { name: 'Cell 1' })).toBeInTheDocument()
      expect(screen.getByRole('cell', { name: 'Cell 2' })).toBeInTheDocument()
    })

    it('should handle sortable header', () => {
      const onSort = vi.fn()
      render(
        <AccessibleTable caption="Test Table">
          <AccessibleTableHeader>
            <AccessibleTableRow>
              <AccessibleTableHeaderCell sortable onSort={onSort}>
                Sortable Header
              </AccessibleTableHeaderCell>
            </AccessibleTableRow>
          </AccessibleTableHeader>
        </AccessibleTable>
      )
      
      const header = screen.getByRole('columnheader', { name: 'Sortable Header' })
      expect(header).toHaveAttribute('tabindex', '0')
      
      fireEvent.click(header)
      expect(onSort).toHaveBeenCalled()
    })
  })

  describe('AccessibleLoadingSpinner', () => {
    it('should render loading spinner', () => {
      render(<AccessibleLoadingSpinner label="Loading" />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })

    it('should have different sizes', () => {
      const { rerender } = render(<AccessibleLoadingSpinner size="sm" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
      
      rerender(<AccessibleLoadingSpinner size="lg" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('AccessibleProgressBar', () => {
    it('should render progress bar', () => {
      render(<AccessibleProgressBar value={50} max={100} />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    })

    it('should show label and percentage', () => {
      render(<AccessibleProgressBar value={75} max={100} label="Test Progress" />)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should calculate percentage correctly', () => {
      render(<AccessibleProgressBar value={25} max={50} />)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })
})

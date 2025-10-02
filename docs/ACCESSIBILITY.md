# Accessibility Guide

This document provides comprehensive guidance on accessibility implementation in the NameDrop application.

## Overview

The NameDrop application is designed to be accessible to all users, including those with disabilities. We follow WCAG 2.1 AA guidelines and implement best practices for inclusive design.

## Accessibility Features

### Keyboard Navigation

- **Tab Navigation**: All interactive elements are accessible via keyboard
- **Focus Management**: Clear focus indicators and logical tab order
- **Keyboard Shortcuts**: Common keyboard shortcuts for power users
- **Focus Trapping**: Modal dialogs trap focus appropriately

### Screen Reader Support

- **ARIA Labels**: Descriptive labels for all interactive elements
- **Live Regions**: Dynamic content updates are announced
- **Semantic HTML**: Proper use of HTML5 semantic elements
- **Heading Structure**: Logical heading hierarchy for navigation

### Visual Accessibility

- **Color Contrast**: WCAG AA compliant color combinations
- **High Contrast Mode**: Support for high contrast display modes
- **Responsive Design**: Accessible across all device sizes
- **Zoom Support**: Content remains accessible at 200% zoom

### Motor Accessibility

- **Large Touch Targets**: Minimum 44px touch targets
- **No Hover Dependencies**: All functionality available without hover
- **Reduced Motion**: Respects user motion preferences
- **Alternative Input**: Support for alternative input methods

## Implementation

### ARIA Implementation

```typescript
// Proper ARIA labeling
<button aria-label="Close dialog" aria-describedby="close-description">
  <span aria-hidden="true">×</span>
</button>

// Form validation
<input 
  aria-invalid="true" 
  aria-describedby="error-message"
  aria-required="true"
/>
<div id="error-message" role="alert">This field is required</div>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Focus Management

```typescript
// Focus trap for modals
<FocusTrap active={isOpen} onEscape={onClose}>
  <div role="dialog" aria-modal="true">
    {/* Modal content */}
  </div>
</FocusTrap>

// Skip links for keyboard navigation
<SkipLink href="#main">Skip to main content</SkipLink>

// Focus restoration
useEffect(() => {
  const previousFocus = document.activeElement
  return () => {
    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus()
    }
  }
}, [])
```

### Color Contrast

```typescript
// Color contrast validation
const contrastRatio = ColorContrast.getContrastRatio('#000000', '#ffffff')
const meetsWCAG = ColorContrast.meetsWCAG('#000000', '#ffffff', 'AA')

// High contrast mode support
@media (prefers-contrast: high) {
  .button {
    border: 2px solid currentColor;
  }
}
```

### Responsive Design

```typescript
// Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive content */}
</div>

// Touch-friendly sizing
<button className="min-h-[44px] min-w-[44px]">
  Touch Target
</button>
```

## Testing

### Automated Testing

```bash
# Run accessibility tests
npm run test:accessibility

# Run E2E accessibility tests
npm run test:e2e tests/accessibility.spec.ts

# Run accessibility audit
npm run audit:accessibility
```

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test all keyboard shortcuts

2. **Screen Reader Testing**
   - Use NVDA, JAWS, or VoiceOver
   - Verify all content is announced
   - Test form interactions

3. **Visual Testing**
   - Test with high contrast mode
   - Verify color contrast ratios
   - Test at different zoom levels

### Testing Tools

- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built-in accessibility auditing
- **Pa11y**: Command-line accessibility testing

## WCAG 2.1 Compliance

### Level AA Requirements

- **1.4.3 Contrast (Minimum)**: Text has 4.5:1 contrast ratio
- **1.4.4 Resize Text**: Text can be resized to 200% without loss of functionality
- **2.1.1 Keyboard**: All functionality is available from a keyboard
- **2.1.2 No Keyboard Trap**: Focus can be moved away from any component
- **2.4.1 Bypass Blocks**: Skip links allow bypassing repeated content
- **2.4.2 Page Titled**: Pages have descriptive titles
- **2.4.3 Focus Order**: Focus order is logical and meaningful
- **2.4.4 Link Purpose**: Link purpose is clear from link text or context
- **3.1.1 Language of Page**: Page language is identified
- **3.2.1 On Focus**: Focus does not trigger unexpected context changes
- **3.2.2 On Input**: Input does not trigger unexpected context changes
- **4.1.1 Parsing**: Markup is valid and well-formed
- **4.1.2 Name, Role, Value**: UI components have accessible names and roles

### Level AAA Requirements (Where Applicable)

- **1.4.6 Contrast (Enhanced)**: Text has 7:1 contrast ratio
- **1.4.8 Visual Presentation**: Text can be presented in various ways
- **2.1.3 Keyboard (No Exception)**: All functionality is available from keyboard
- **2.4.6 Headings and Labels**: Headings and labels are descriptive
- **2.4.7 Focus Visible**: Keyboard focus is clearly visible
- **3.1.2 Language of Parts**: Language of content is identified
- **3.2.3 Consistent Navigation**: Navigation is consistent across pages
- **3.2.4 Consistent Identification**: Components with same functionality are identified consistently

## Best Practices

### Content

- Use clear, simple language
- Provide alternative text for images
- Use descriptive link text
- Structure content with proper headings
- Provide captions for videos

### Navigation

- Implement skip links
- Use consistent navigation patterns
- Provide breadcrumbs for complex sites
- Ensure logical tab order
- Use proper heading hierarchy

### Forms

- Provide clear labels for all inputs
- Use fieldset and legend for grouped inputs
- Provide helpful error messages
- Allow users to correct errors
- Use appropriate input types

### Interactive Elements

- Make buttons and links large enough to click
- Provide clear focus indicators
- Use appropriate ARIA roles
- Ensure all functionality is keyboard accessible
- Provide loading states and feedback

## Common Issues and Solutions

### Issue: Missing Alt Text

**Problem**: Images without alt text are not accessible to screen readers.

**Solution**:
```typescript
// Good
<img src="chart.png" alt="Sales chart showing 25% increase" />

// Bad
<img src="chart.png" />
```

### Issue: Poor Color Contrast

**Problem**: Text is not readable against background colors.

**Solution**:
```typescript
// Use color contrast checker
const contrast = ColorContrast.getContrastRatio('#666666', '#ffffff')
if (contrast < 4.5) {
  // Use darker text color
}
```

### Issue: Missing Form Labels

**Problem**: Form inputs without labels are not accessible.

**Solution**:
```typescript
// Good
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />

// Bad
<input type="email" placeholder="Email" />
```

### Issue: Inaccessible Modals

**Problem**: Modal dialogs that don't trap focus or announce properly.

**Solution**:
```typescript
// Use FocusTrap component
<FocusTrap active={isOpen} onEscape={onClose}>
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">Modal Title</h2>
    {/* Modal content */}
  </div>
</FocusTrap>
```

## Accessibility Testing Checklist

### Content
- [ ] All images have alt text
- [ ] Videos have captions
- [ ] Audio has transcripts
- [ ] Content is readable at 200% zoom
- [ ] Color is not the only way to convey information

### Navigation
- [ ] Skip links are present and functional
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] All interactive elements are keyboard accessible
- [ ] Navigation is consistent across pages

### Forms
- [ ] All inputs have labels
- [ ] Error messages are clear and helpful
- [ ] Required fields are marked
- [ ] Form validation is accessible
- [ ] Users can correct errors

### Interactive Elements
- [ ] Buttons have descriptive text
- [ ] Links have clear purpose
- [ ] Modals trap focus and announce properly
- [ ] Dropdowns are keyboard accessible
- [ ] Loading states are announced

### Technical
- [ ] HTML is valid and semantic
- [ ] ARIA attributes are used correctly
- [ ] Page titles are descriptive
- [ ] Language is specified
- [ ] No keyboard traps

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [Accessibility Developer Guide](https://www.accessibility-developer-guide.com/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

### Browser Extensions
- axe DevTools
- WAVE
- Accessibility Insights
- Lighthouse

## Support

For accessibility questions or issues, please:

1. Check this documentation
2. Run accessibility tests
3. Test with assistive technologies
4. Consult WCAG guidelines
5. Contact the development team

## Updates

This accessibility guide is regularly updated to reflect:

- New WCAG guidelines
- Updated testing tools
- Improved implementation patterns
- User feedback and testing results

Last updated: January 2025

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AccessibilityTester, ColorContrast } from '@/lib/accessibility'

/**
 * Accessibility tester component
 * 
 * Provides tools for testing accessibility compliance including:
 * - Element testing
 * - Color contrast checking
 * - Keyboard navigation testing
 * - Screen reader testing
 */
export function AccessibilityTester() {
  const [testResults, setTestResults] = useState<{
    element: HTMLElement | null
    results: {
      hasProperARIA: boolean
      isKeyboardAccessible: boolean
      hasProperFocusManagement: boolean
      score: number
    } | null
  }>({ element: null, results: null })
  
  const [colorContrast, setColorContrast] = useState<{
    foreground: string
    background: string
    ratio: number
    meetsAA: boolean
    meetsAAA: boolean
  }>({
    foreground: '#000000',
    background: '#ffffff',
    ratio: 0,
    meetsAA: false,
    meetsAAA: false
  })
  
  const [isTesting, setIsTesting] = useState(false)
  const testAreaRef = useRef<HTMLDivElement>(null)

  /**
   * Test accessibility of an element
   */
  const testElement = (element: HTMLElement) => {
    const results = AccessibilityTester.testElement(element)
    setTestResults({ element, results })
  }

  /**
   * Test all elements in the test area
   */
  const testAllElements = () => {
    if (!testAreaRef.current) return
    
    setIsTesting(true)
    
    const elements = testAreaRef.current.querySelectorAll('*')
    const results: Array<{
      element: HTMLElement
      results: ReturnType<typeof AccessibilityTester.testElement>
    }> = []
    
    elements.forEach((element) => {
      if (element instanceof HTMLElement) {
        const elementResults = AccessibilityTester.testElement(element)
        results.push({ element, results: elementResults })
      }
    })
    
    // Find the element with the lowest score
    const worstElement = results.reduce((worst, current) => 
      current.results.score < worst.results.score ? current : worst
    )
    
    setTestResults({
      element: worstElement.element,
      results: worstElement.results
    })
    
    setIsTesting(false)
  }

  /**
   * Check color contrast
   */
  const checkColorContrast = (foreground: string, background: string) => {
    const ratio = ColorContrast.getContrastRatio(foreground, background)
    const meetsAA = ColorContrast.meetsWCAG(foreground, background, 'AA')
    const meetsAAA = ColorContrast.meetsWCAG(foreground, background, 'AAA')
    
    setColorContrast({
      foreground,
      background,
      ratio,
      meetsAA,
      meetsAAA
    })
  }

  /**
   * Handle color input change
   */
  const handleColorChange = (type: 'foreground' | 'background', color: string) => {
    const newForeground = type === 'foreground' ? color : colorContrast.foreground
    const newBackground = type === 'background' ? color : colorContrast.background
    
    checkColorContrast(newForeground, newBackground)
  }

  return (
    <div className="space-y-6">
      {/* Test Area */}
      <Card>
        <CardHeader>
          <CardTitle>Test Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={testAreaRef}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold">Sample Elements</h3>
            
            <div className="space-y-2">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Accessible Button
              </button>
              
              <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
                Secondary Button
              </button>
              
              <input
                type="text"
                placeholder="Sample input"
                className="px-3 py-2 border border-input rounded-md"
              />
              
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="sample-checkbox" />
                <label htmlFor="sample-checkbox">Sample checkbox</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input type="radio" id="sample-radio" name="sample-radio" />
                <label htmlFor="sample-radio">Sample radio</label>
              </div>
              
              <select className="px-3 py-2 border border-input rounded-md">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <Button onClick={testAllElements} disabled={isTesting}>
              {isTesting ? 'Testing...' : 'Test All Elements'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setTestResults({ element: null, results: null })}
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.results && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Element: {testResults.element?.tagName}</h4>
              <p className="text-sm text-muted-foreground">
                {testResults.element?.className || 'No class name'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proper ARIA</span>
                <Badge className={testResults.results.hasProperARIA ? 'bg-green-500' : 'bg-red-500'}>
                  {testResults.results.hasProperARIA ? 'Pass' : 'Fail'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Keyboard Accessible</span>
                <Badge className={testResults.results.isKeyboardAccessible ? 'bg-green-500' : 'bg-red-500'}>
                  {testResults.results.isKeyboardAccessible ? 'Pass' : 'Fail'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Focus Management</span>
                <Badge className={testResults.results.hasProperFocusManagement ? 'bg-green-500' : 'bg-red-500'}>
                  {testResults.results.hasProperFocusManagement ? 'Pass' : 'Fail'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <Badge className={
                  testResults.results.score >= 80 ? 'bg-green-500' :
                  testResults.results.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }>
                  {testResults.results.score.toFixed(0)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Color Contrast Checker */}
      <Card>
        <CardHeader>
          <CardTitle>Color Contrast Checker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Foreground Color</label>
              <input
                type="color"
                value={colorContrast.foreground}
                onChange={(e) => handleColorChange('foreground', e.target.value)}
                className="w-full h-10 border rounded-md"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Background Color</label>
              <input
                type="color"
                value={colorContrast.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="w-full h-10 border rounded-md"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Contrast Ratio</span>
              <span className="text-sm font-mono">{colorContrast.ratio.toFixed(2)}:1</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">WCAG AA (4.5:1)</span>
              <Badge className={colorContrast.meetsAA ? 'bg-green-500' : 'bg-red-500'}>
                {colorContrast.meetsAA ? 'Pass' : 'Fail'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">WCAG AAA (7:1)</span>
              <Badge className={colorContrast.meetsAAA ? 'bg-green-500' : 'bg-red-500'}>
                {colorContrast.meetsAAA ? 'Pass' : 'Fail'}
              </Badge>
            </div>
          </div>
          
          <div 
            className="p-4 rounded-md text-center"
            style={{ 
              backgroundColor: colorContrast.background,
              color: colorContrast.foreground
            }}
          >
            <p className="text-sm">Sample text with current colors</p>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Navigation Tester */}
      <Card>
        <CardHeader>
          <CardTitle>Keyboard Navigation Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use Tab, Shift+Tab, Enter, Space, and Arrow keys to navigate
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button className="px-3 py-2 border border-input rounded-md hover:bg-accent focus:ring-2 focus:ring-ring">
              Button 1
            </button>
            <button className="px-3 py-2 border border-input rounded-md hover:bg-accent focus:ring-2 focus:ring-ring">
              Button 2
            </button>
            <button className="px-3 py-2 border border-input rounded-md hover:bg-accent focus:ring-2 focus:ring-ring">
              Button 3
            </button>
            <button className="px-3 py-2 border border-input rounded-md hover:bg-accent focus:ring-2 focus:ring-ring">
              Button 4
            </button>
            <button className="px-3 py-2 border border-input rounded-md hover:bg-accent focus:ring-2 focus:ring-ring">
              Button 5
            </button>
            <button className="px-3 py-2 border border-input rounded-md hover:bg-accent focus:ring-2 focus:ring-ring">
              Button 6
            </button>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Navigation Instructions</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> to move forward</li>
              <li>• Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift + Tab</kbd> to move backward</li>
              <li>• Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> to activate</li>
              <li>• Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Arrow Keys</kbd> to navigate within groups</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

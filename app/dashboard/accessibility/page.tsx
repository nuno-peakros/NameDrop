import { AccessibilityTester } from '@/components/ui/accessibility-tester'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * Accessibility testing dashboard page
 * 
 * This page provides:
 * - Accessibility testing tools
 * - WCAG compliance checking
 * - Color contrast validation
 * - Keyboard navigation testing
 * - Screen reader testing
 */
export default function AccessibilityPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accessibility Testing</h1>
          <p className="text-muted-foreground">
            Test and improve accessibility compliance
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          WCAG 2.1 AA
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accessibility Tester */}
        <div className="lg:col-span-2">
          <AccessibilityTester />
        </div>

        {/* WCAG Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>WCAG 2.1 Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Perceivable</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Provide text alternatives for images</li>
                <li>• Provide captions for videos</li>
                <li>• Use sufficient color contrast</li>
                <li>• Make content adaptable</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Operable</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Make all functionality keyboard accessible</li>
                <li>• Provide enough time to read content</li>
                <li>• Avoid content that causes seizures</li>
                <li>• Help users navigate and find content</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Understandable</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Make text readable and understandable</li>
                <li>• Make content appear and operate predictably</li>
                <li>• Help users avoid and correct mistakes</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Robust</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Maximize compatibility with assistive technologies</li>
                <li>• Use valid, semantic HTML</li>
                <li>• Follow accessibility standards</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Color Contrast Checker */}
        <Card>
          <CardHeader>
            <CardTitle>Color Contrast Checker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Foreground Color</label>
              <input
                type="color"
                className="w-full h-10 border rounded-md"
                defaultValue="#000000"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Background Color</label>
              <input
                type="color"
                className="w-full h-10 border rounded-md"
                defaultValue="#ffffff"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Contrast Ratio</span>
                <Badge className="bg-green-500">4.5:1</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WCAG AA</span>
                <Badge className="bg-green-500">Pass</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WCAG AAA</span>
                <Badge className="bg-yellow-500">Fail</Badge>
              </div>
            </div>
            
            <Button className="w-full" size="sm">
              Check Contrast
            </Button>
          </CardContent>
        </Card>

        {/* Keyboard Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Keyboard Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Navigation Keys</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> - Move to next element</li>
                <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift + Tab</kbd> - Move to previous element</li>
                <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> - Activate element</li>
                <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> - Activate element</li>
                <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Escape</kbd> - Close modal/menu</li>
                <li>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Arrow Keys</kbd> - Navigate within groups</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Focus Indicators</h4>
              <p className="text-sm text-muted-foreground">
                All interactive elements should have visible focus indicators
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Screen Reader Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Screen Reader Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Testing Tools</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• NVDA (Windows, free)</li>
                <li>• JAWS (Windows, paid)</li>
                <li>• VoiceOver (macOS, free)</li>
                <li>• TalkBack (Android, free)</li>
                <li>• VoiceOver (iOS, free)</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Testing Checklist</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All content is announced</li>
                <li>• Navigation is logical</li>
                <li>• Form labels are clear</li>
                <li>• Error messages are announced</li>
                <li>• Headings are properly structured</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Documentation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <a href="https://www.w3.org/WAI/WCAG21/quickref/" className="text-primary hover:underline">WCAG 2.1 Quick Reference</a></li>
                <li>• <a href="https://webaim.org/" className="text-primary hover:underline">WebAIM</a></li>
                <li>• <a href="https://www.accessibility-developer-guide.com/" className="text-primary hover:underline">Accessibility Developer Guide</a></li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Testing Tools</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <a href="https://wave.webaim.org/" className="text-primary hover:underline">WAVE</a></li>
                <li>• <a href="https://www.deque.com/axe/" className="text-primary hover:underline">axe DevTools</a></li>
                <li>• <a href="https://www.accessibility-developer-guide.com/tools/browser-extensions/" className="text-primary hover:underline">Browser Extensions</a></li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

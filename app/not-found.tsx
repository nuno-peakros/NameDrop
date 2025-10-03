'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Custom 404 Not Found Page
 * 
 * Features:
 * - Clean, professional design
 * - Navigation options (only if logged in)
 * - Sign out functionality (only if logged in)
 * - Consistent with app theme
 */
export default function NotFound() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const checkAuthStatus = () => {
      const token = localStorage.getItem('auth-token')
      setIsLoggedIn(!!token)
      setIsLoading(false)
    }

    checkAuthStatus()
  }, [])

  const handleSignOut = () => {
    // Clear auth token
    localStorage.removeItem('auth-token')
    // Redirect to login
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="text-6xl font-bold text-muted-foreground">404</div>
            <div>
              <CardTitle className="text-2xl font-bold">Page Not Found</CardTitle>
              <CardDescription className="text-muted-foreground">
                The page you&apos;re looking for doesn&apos;t exist
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                The page you requested could not be found. It may have been moved, deleted, or you may have entered an incorrect URL.
              </p>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : isLoggedIn ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-destructive hover:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    href="/" 
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Home
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                  
                  <Link 
                    href="/login" 
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
            
            <div className="text-center text-xs text-muted-foreground">
              <p>Need help? Contact support@peakros.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

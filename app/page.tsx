'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * NameDrop Internal Landing Page
 * 
 * Simple, clean landing page for internal use with focus on authentication.
 * Matches the dark theme and design system of the application.
 */
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.svg"
                alt="NameDrop Logo"
                width={300}
                height={300}
                className="text-primary"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold">Welcome</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to access the NameDrop application
              </p>
            </div>
            
            <div className="space-y-4">
              <Link href="/login" className="w-full">
                <Button className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
            
            <div className="text-center text-xs text-muted-foreground">
              <p>This is a Peakros Internal Application. If you require access contact support@peakros.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

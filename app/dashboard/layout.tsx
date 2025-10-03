'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ClientOnly } from '@/components/client-only'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Menu, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  LayoutDashboard,
  Users,
  BarChart3,
  Shield
} from 'lucide-react'


/**
 * Dashboard layout component
 * 
 * Features:
 * - Responsive sidebar navigation
 * - Mobile menu support
 * - Error boundary for error handling
 * - User authentication state
 * - Consistent layout structure
 * 
 * @param children - Child components to render
 * 
 * @returns JSX element
 */
interface DashboardLayoutProps {
  /** Child components to render */
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [user, setUser] = React.useState<{
    name: string
    email: string
    role: string
    avatar?: string
  } | null>(null)

  /**
   * Load user data on mount
   */
  React.useEffect(() => {
    // Just set user data - no redirects
    setUser({
      name: 'Demo Administrator',
      email: 'admin@namedrop.com',
      role: 'admin',
    })
  }, [])

  /**
   * Navigation items
   */
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Users',
      href: '/dashboard/users',
      icon: Users,
    },
    {
      name: 'Security',
      href: '/dashboard/security',
      icon: Shield,
    },
    {
      name: 'Performance',
      href: '/dashboard/performance',
      icon: BarChart3,
    },
  ]

  return (
    <ClientOnly>
      <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <Image 
                src="/logo.svg" 
                alt="NameDrop Logo" 
                width={180} 
                height={180} 
                className="text-primary"
                priority
                unoptimized
              />
            </div>
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 ${
                      isActive 
                        ? 'text-foreground bg-accent' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right side - User Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link 
                        href={item.href}
                        className={`flex items-center gap-2 w-full ${
                          isActive ? 'bg-accent' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-foreground">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.name || 'User'}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    localStorage.removeItem('auth-token')
                    window.location.href = '/login'
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        {children}
      </main>
      </div>
    </ClientOnly>
  )
}

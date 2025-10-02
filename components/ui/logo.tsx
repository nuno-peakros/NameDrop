import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Logo component with customizable size and styling
 * 
 * @param className - Additional CSS classes
 * @param size - Logo size (sm, md, lg, xl)
 * @param variant - Logo variant (default, minimal, full)
 * @param props - Additional props passed to the SVG element
 * 
 * @example
 * ```tsx
 * <Logo size="lg" className="text-primary" />
 * <Logo variant="minimal" size="sm" />
 * ```
 */
interface LogoProps extends React.SVGProps<SVGSVGElement> {
  /** Additional CSS classes */
  className?: string
  /** Logo size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Logo style variant */
  variant?: 'default' | 'minimal' | 'full'
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
} as const

function Logo({ 
  className, 
  size = 'md', 
  variant = 'default',
  ...props 
}: LogoProps) {
  const sizeValue = sizeMap[size]
  
  return (
    <svg
      width={sizeValue}
      height={sizeValue}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      {...props}
    >
      <rect 
        width="40" 
        height="40" 
        rx="8" 
        fill="currentColor" 
        fillOpacity="0.1"
        className={cn(
          variant === 'minimal' && "fill-transparent",
          variant === 'full' && "fill-primary/20"
        )}
      />
      <path 
        d="M12 16h16v2H12v-2zm0 4h16v2H12v-2zm0 4h12v2H12v-2z" 
        fill="currentColor"
        className={cn(
          variant === 'minimal' && "opacity-60"
        )}
      />
      <circle 
        cx="20" 
        cy="12" 
        r="3" 
        fill="currentColor"
        className={cn(
          variant === 'minimal' && "opacity-80"
        )}
      />
    </svg>
  )
}

export { Logo, type LogoProps }

"use client"

import { forwardRef } from "react"
import { cn } from "@lib/utils"
import Spinner from "@modules/common/icons/spinner"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "link"
  size?: "sm" | "md" | "lg" | "xl" | "icon"
  loading?: boolean
  isLoading?: boolean // Alias for loading (for compatibility)
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      isLoading = false, // Accept isLoading as alias
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Support both loading and isLoading props
    const isLoadingState = loading || isLoading
    const baseStyles = cn(
      "inline-flex items-center justify-center font-medium",
      "transition-all duration-200 ease-out",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "active:scale-[0.98]"
    )

    const variants = {
      primary: cn(
        "bg-stone-800 text-white",
        "hover:bg-stone-700",
        "active:bg-stone-900"
      ),
      secondary: cn(
        "bg-transparent text-stone-800 border border-stone-300",
        "hover:bg-stone-50 hover:border-stone-400",
        "active:bg-stone-100"
      ),
      ghost: cn(
        "bg-transparent text-stone-600",
        "hover:bg-stone-100 hover:text-stone-800",
        "active:bg-stone-200"
      ),
      danger: cn(
        "bg-error text-white",
        "hover:bg-red-700",
        "active:bg-red-800"
      ),
      link: cn(
        "bg-transparent text-stone-600 underline-offset-4",
        "hover:text-stone-800 hover:underline",
        "p-0 h-auto"
      ),
    }

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5",
      md: "h-10 px-4 text-sm rounded-lg gap-2",
      lg: "h-12 px-6 text-base rounded-lg gap-2",
      xl: "h-14 px-8 text-lg rounded-xl gap-2.5",
      icon: "h-10 w-10 rounded-lg p-0",
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          isLoadingState && "relative text-transparent",
          className
        )}
        disabled={disabled || isLoadingState}
        {...props}
      >
        {isLoadingState && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner className="animate-spin h-5 w-5 text-current" />
          </div>
        )}
        {leftIcon && !isLoadingState && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {rightIcon && !isLoadingState && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }


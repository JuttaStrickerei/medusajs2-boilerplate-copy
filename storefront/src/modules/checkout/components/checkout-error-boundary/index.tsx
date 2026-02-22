"use client"

import React, { Component, ReactNode } from "react"
import { Button } from "@medusajs/ui"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * @name CheckoutErrorBoundary
 * @description Error Boundary specifically for the checkout flow.
 * Catches React errors during order placement and shows a graceful fallback
 * instead of the default Next.js error overlay. Redirects to cart on recovery.
 */
export class CheckoutErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Checkout Error Boundary caught an error:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    // Reload the page to get fresh data
    window.location.reload()
  }

  private handleGoToCart = () => {
    // Extract country code from URL or default to 'de'
    const pathParts = window.location.pathname.split("/")
    const countryCode = pathParts[1] || "de"
    window.location.href = `/${countryCode}/cart`
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI - no red error screen
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-stone-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-xl text-stone-800">
                Ein Fehler ist aufgetreten
              </h2>
              <p className="text-stone-600 text-sm">
                Bei der Verarbeitung Ihrer Bestellung ist ein technischer Fehler aufgetreten. 
                Ihre Zahlung wurde möglicherweise bereits durchgeführt. 
                Bitte überprüfen Sie Ihren Account oder kontaktieren Sie uns.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="text-left bg-stone-50 p-4 rounded-lg border border-stone-200">
                <p className="text-xs text-stone-500 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="secondary">
                Erneut versuchen
              </Button>
              <Button onClick={this.handleGoToCart}>
                Zum Warenkorb
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default CheckoutErrorBoundary

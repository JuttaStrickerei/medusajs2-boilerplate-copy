"use client"

import { useEffect, useState, createContext, useContext, useCallback } from "react"
import { cn } from "@lib/utils"
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "@components/icons"

// Toast Types
type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

// Context
interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

// Hook
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Toast Container
function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: Toast[]
  onClose: (id: string) => void
}) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

// Toast Item
function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast
  onClose: (id: string) => void
}) {
  const { id, type, title, message, duration = 5000 } = toast

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  }

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  }

  const iconStyles = {
    success: "text-green-500",
    error: "text-red-500",
    info: "text-blue-500",
    warning: "text-yellow-500",
  }

  const Icon = icons[type]

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl border shadow-lg",
        "backdrop-blur-sm pointer-events-auto",
        "animate-in slide-in-from-right-full fade-in duration-300",
        styles[type]
      )}
      role="alert"
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconStyles[type])} />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        {message && (
          <p className="mt-1 text-sm opacity-80">{message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="p-1 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
        aria-label="Schließen"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Quick toast functions
export function toast(options: Omit<Toast, "id">) {
  // This is a workaround for using toast outside of React components
  // In a real implementation, you'd use a global state management solution
  const event = new CustomEvent("toast", { detail: options })
  window.dispatchEvent(event)
}

toast.success = (title: string, message?: string) => 
  toast({ type: "success", title, message })

toast.error = (title: string, message?: string) => 
  toast({ type: "error", title, message })

toast.info = (title: string, message?: string) => 
  toast({ type: "info", title, message })

toast.warning = (title: string, message?: string) => 
  toast({ type: "warning", title, message })

export default ToastProvider


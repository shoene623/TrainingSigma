"use client"

// Simplified version of the toast hook
import { useState } from "react"

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = ({ title, description, variant = "default", duration = 3000 }) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, title, description, variant, duration }

    setToasts((prevToasts) => [...prevToasts, newToast])

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, duration)

    return id
  }

  const dismiss = (toastId) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId))
  }

  return { toast, dismiss, toasts }
}


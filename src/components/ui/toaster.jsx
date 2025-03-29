import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(({ id, title, description, variant }) => (
        <div
          key={id}
          className={`mb-2 w-full rounded-lg border p-4 shadow-lg ${
            variant === "destructive" ? "border-red-500 bg-red-50 text-red-900" : "border-gray-200 bg-white"
          }`}
        >
          {title && <div className="font-medium">{title}</div>}
          {description && <div className="text-sm text-gray-500">{description}</div>}
        </div>
      ))}
    </div>
  )
}


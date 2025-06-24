"use client"

import { Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeAwareLogo({ className }: { className?: string }) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Sparkles className={className} />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <div className="relative">
      <Sparkles
        className={`${className} ${isDark ? "text-blue-400" : "text-blue-600"} transition-colors duration-200`}
      />
      <div
        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse transition-colors duration-200 ${
          isDark ? "bg-gradient-to-r from-purple-400 to-pink-400" : "bg-gradient-to-r from-purple-500 to-pink-500"
        }`}
      ></div>
    </div>
  )
}

"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Monitor, Moon, Sun } from "lucide-react"

export function ThemeStatus() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-3 w-3" />
      case "dark":
        return <Moon className="h-3 w-3" />
      case "system":
        return <Monitor className="h-3 w-3" />
      default:
        return <Monitor className="h-3 w-3" />
    }
  }

  const getThemeLabel = () => {
    if (theme === "system") {
      return `System (${resolvedTheme})`
    }
    return theme?.charAt(0).toUpperCase() + theme?.slice(1)
  }

  return (
    <Badge variant="outline" className="gap-1 text-xs">
      {getThemeIcon()}
      {getThemeLabel()}
    </Badge>
  )
}

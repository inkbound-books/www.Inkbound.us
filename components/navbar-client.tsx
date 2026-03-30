"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Moon, Sun, Menu, X, ChevronUp } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavLink {
  href: string
  label: string
}

interface NavbarClientProps {
  links: NavLink[]
}

export function NavbarClient({ links }: NavbarClientProps) {
  const pathname = usePathname()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [userHidden, setUserHidden] = useState(false)
  const [showRevealButton, setShowRevealButton] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY

    if (userHidden) {
      setShowRevealButton(currentY > 80)
      return
    }

    if (currentY < 60) {
      setNavVisible(true)
      setShowRevealButton(false)
      return
    }

    if (currentY > lastScrollY + 8) {
      setNavVisible(false)
      setShowRevealButton(true)
    } else if (currentY < lastScrollY - 8) {
      setNavVisible(true)
      setShowRevealButton(false)
    }

    setLastScrollY(currentY)
  }, [lastScrollY, userHidden])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const toggleNavVisibility = () => {
    if (navVisible) {
      setUserHidden(true)
      setNavVisible(false)
      setShowRevealButton(true)
    } else {
      setUserHidden(false)
      setNavVisible(true)
      setShowRevealButton(false)
    }
  }

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 left-0 right-0 z-50 border-b border-border bg-[var(--navbar-bg)] backdrop-blur-md",
          "transition-transform duration-300 ease-in-out",
          navVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-3xl text-primary transition-colors hover:text-accent"
          >
            Inkbound
          </Link>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "relative font-medium transition-colors hover:text-primary",
                    "after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full",
                    pathname === link.href && "text-primary after:w-full"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
                className="rounded-full bg-transparent"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="hidden rounded-full md:flex opacity-40 hover:opacity-100 transition-opacity"
              onClick={toggleNavVisibility}
              aria-label="Hide navigation"
              title="Hide navigation bar"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="rounded-full md:hidden bg-transparent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div
          className={cn(
            "overflow-hidden border-t border-border bg-background transition-all duration-300 md:hidden",
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <ul className="flex flex-col gap-1 px-4 py-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-2 font-medium transition-colors hover:bg-muted hover:text-primary",
                    pathname === link.href && "bg-muted text-primary"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Reveal button */}
      <button
        onClick={toggleNavVisibility}
        className={cn(
          "fixed top-0 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-1.5 px-4 py-1.5 rounded-b-xl",
          "bg-[var(--navbar-bg)] backdrop-blur-md border border-t-0 border-border",
          "text-xs font-medium text-muted-foreground hover:text-primary",
          "transition-all duration-300 shadow-sm hover:shadow-md",
          showRevealButton ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
        aria-label="Show navigation"
      >
        <ChevronUp className="h-3.5 w-3.5 rotate-180" />
        Menu
      </button>
    </>
  )
}

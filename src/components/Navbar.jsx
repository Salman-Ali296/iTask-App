import { useEffect, useState } from "react"
import { Moon, SunMedium, ClipboardCheck, Menu, X } from "lucide-react"

export default function Navbar() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  )
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-neutral-900/70 border-b border-violet-200/50 dark:border-neutral-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-violet-700 dark:text-violet-400" />
          <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
            iTasks App
          </span>
        </div>

        {}
        <nav className="hidden md:flex items-center gap-6">
          {["Home", "About", "Services", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-neutral-700 dark:text-neutral-200 hover:text-violet-600 dark:hover:text-violet-400 transition font-medium"
            >
              {item}
            </a>
          ))}
          <button
            onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
            className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <SunMedium className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </nav>

        {}
        <button
          className="md:hidden inline-flex items-center text-neutral-700 dark:text-neutral-200"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-4 py-4 space-y-4">
          {["Home", "About", "Services", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="block text-neutral-700 dark:text-neutral-200 hover:text-violet-600 dark:hover:text-violet-400 transition font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <button
            onClick={() => {
              setTheme(t => (t === "dark" ? "light" : "dark"))
              setMenuOpen(false)
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            {theme === "dark" ? <SunMedium className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      )}
    </header>
  )
}

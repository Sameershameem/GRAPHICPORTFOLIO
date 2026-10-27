import { useState } from 'react'

function apply(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f2f1ee' : '#0b0b0c')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    /* storage unavailable: theme still applies for this visit */
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark')
  const pick = (t) => {
    setTheme(t)
    apply(t)
  }
  return (
    <div className="flex items-center rounded-full border border-line bg-panel p-[0.25em] text-[11px] font-semibold backdrop-blur-md sm:text-[clamp(11px,0.9vw,14px)]">
      {['dark', 'light'].map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => pick(t)}
          aria-pressed={theme === t}
          className={`rounded-full px-[0.85em] py-[0.25em] capitalize transition-colors duration-300 ${
            theme === t ? 'bg-fg/12 text-fg' : 'text-muted hover:text-fg'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

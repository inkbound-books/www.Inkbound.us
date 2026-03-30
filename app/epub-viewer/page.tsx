"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import JSZip from "jszip"

// ─── VULN-06 fix: all EPUB HTML is rendered inside a sandboxed iframe.
// The sandbox attribute grants NO permissions by default — no scripts, no same-origin access,
// no forms, no popups. Content is served as a blob URL so it's isolated from www.inkbound.us.

function sanitizeEpubHtml(raw: string): string {
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
}

interface ReaderSettings {
  font: string
  fontSize: number
  lineHeight: number
  theme: string
  maxWidth: number
}

// Inject reader styles into the HTML blob so they work inside the sandboxed iframe.
// Since sandbox="" blocks all network access, fonts are loaded via @import inside the blob
// which the browser allows because it's a data/blob origin — BUT sandbox="" also blocks
// allow-same-origin, so external @imports won't load. We use web-safe fallbacks + system fonts.
function injectReaderStyles(html: string, settings: ReaderSettings): string {
  const { font, fontSize, lineHeight, theme, maxWidth } = settings

  const themes: Record<string, { bg: string; text: string; link: string; border: string }> = {
    light:  { bg: "#ffffff", text: "#1a1a1a", link: "#6d28d9", border: "#e5e7eb" },
    sepia:  { bg: "#f8f0e3", text: "#3b2f1e", link: "#7c5c2e", border: "#d4c3a0" },
    dark:   { bg: "#1a1a2e", text: "#e0e0e0", link: "#a78bfa", border: "#374151" },
    gray:   { bg: "#2d2d2d", text: "#d4d4d4", link: "#9ca3af", border: "#4b5563" },
  }
  const t = themes[theme] ?? themes.light

  // Font stacks — all web-safe or system fonts, no external network needed
  const fontStacks: Record<string, string> = {
    "Georgia":        "Georgia, 'Times New Roman', serif",
    "Times New Roman":"'Times New Roman', Times, serif",
    "Palatino":       "Palatino, 'Palatino Linotype', 'Book Antiqua', serif",
    "Garamond":       "Garamond, 'EB Garamond', serif",
    "Bookerly":       "Bookerly, Georgia, serif",
    "Arial":          "Arial, Helvetica, sans-serif",
    "Verdana":        "Verdana, Geneva, sans-serif",
    "system-ui":      "system-ui, -apple-system, sans-serif",
    "Courier":        "'Courier New', Courier, monospace",
  }
  const fontStack = fontStacks[font] ?? fontStacks["Georgia"]

  const css = `
    *, *::before, *::after { box-sizing: border-box; }
    html { background: ${t.bg}; margin: 0; padding: 0; }
    body {
      background: ${t.bg};
      color: ${t.text};
      font-family: ${fontStack};
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      margin: 0 auto;
      max-width: ${maxWidth}px;
      padding: 2rem 1.5rem 5rem;
      word-wrap: break-word;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4, h5, h6 {
      line-height: 1.3;
      margin-top: 1.8em;
      margin-bottom: 0.5em;
      color: ${t.text};
    }
    p { margin: 0 0 1em; }
    a { color: ${t.link}; text-decoration: underline; }
    img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
    pre, code { font-family: 'Courier New', monospace; font-size: 0.88em; overflow-x: auto; }
    blockquote {
      border-left: 3px solid ${t.link};
      margin: 1.5em 0;
      padding: 0.5em 1em;
      opacity: 0.85;
      font-style: italic;
    }
    hr { border: none; border-top: 1px solid ${t.border}; margin: 2em 0; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid ${t.border}; padding: 0.5em; }
    /* Common epub classes */
    .chapter-title, .title { font-size: 1.5em; font-weight: bold; margin-bottom: 1em; }
    .center, .centered { text-align: center; }
    .right { text-align: right; }
    .indent { text-indent: 1.5em; }
    .no-indent { text-indent: 0; }
    .drop-cap::first-letter {
      float: left;
      font-size: 3em;
      line-height: 0.8;
      margin: 0.1em 0.1em 0 0;
      color: ${t.link};
    }
  `

  if (/<head[\s>]/i.test(html)) {
    return html.replace(/(<head[\s>][^>]*>)/i, `$1<style>${css}</style>`)
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`
}

interface Chapter {
  id: string
  title: string
  html: string
}

const FONTS = [
  { label: "Georgia (default)", value: "Georgia" },
  { label: "Palatino", value: "Palatino" },
  { label: "Garamond", value: "Garamond" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Arial (sans-serif)", value: "Arial" },
  { label: "Verdana (sans-serif)", value: "Verdana" },
  { label: "System UI", value: "system-ui" },
  { label: "Courier (monospace)", value: "Courier" },
]

const THEMES = [
  { label: "Light",  value: "light", bg: "#ffffff", text: "#1a1a1a" },
  { label: "Sepia",  value: "sepia", bg: "#f8f0e3", text: "#3b2f1e" },
  { label: "Dark",   value: "dark",  bg: "#1a1a2e", text: "#e0e0e0" },
  { label: "Gray",   value: "gray",  bg: "#2d2d2d", text: "#d4d4d4" },
]

const DEFAULT_SETTINGS: ReaderSettings = {
  font: "Georgia",
  fontSize: 18,
  lineHeight: 1.8,
  theme: "light",
  maxWidth: 680,
}

export default function EpubViewerPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track real fullscreen state (handles Esc key exit)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }, [])

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setChapters([])

    try {
      const zip = await JSZip.loadAsync(file)

      const containerXml = await zip.file("META-INF/container.xml")?.async("text")
      if (!containerXml) throw new Error("Invalid EPUB: missing container.xml")

      const opfPath = containerXml.match(/full-path="([^"]+\.opf)"/)?.[1]
      if (!opfPath) throw new Error("Invalid EPUB: cannot locate OPF file")

      const opfXml = await zip.file(opfPath)?.async("text")
      if (!opfXml) throw new Error("Invalid EPUB: cannot read OPF file")

      const opfBase = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : ""

      const manifestItems: Record<string, string> = {}
      const manifestMatches = opfXml.matchAll(/<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"/g)
      for (const m of manifestMatches) {
        manifestItems[m[1]] = m[2]
      }

      const spineIds = [...opfXml.matchAll(/<itemref[^>]+idref="([^"]+)"/g)].map(m => m[1])

      const loaded: Chapter[] = []
      for (const id of spineIds) {
        const href = manifestItems[id]
        if (!href) continue
        const fullPath = opfBase + href
        const rawHtml = await zip.file(fullPath)?.async("text")
        if (!rawHtml) continue
        const sanitized = sanitizeEpubHtml(rawHtml)

        const titleMatch = sanitized.match(/<title>([^<]+)<\/title>/) ??
                           sanitized.match(/<h[12][^>]*>([^<]+)<\/h/)
        const title = titleMatch?.[1]?.trim() ?? `Chapter ${loaded.length + 1}`

        loaded.push({ id, title, html: sanitized })
      }

      if (loaded.length === 0) throw new Error("No readable chapters found in EPUB.")
      setChapters(loaded)
      setCurrentIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load EPUB.")
    } finally {
      setLoading(false)
    }
  }, [])

  const currentChapter = chapters[currentIndex]

  // Revoke old blob, create new one with current settings baked in
  if (blobUrlRef.current) {
    URL.revokeObjectURL(blobUrlRef.current)
    blobUrlRef.current = null
  }
  let blobUrl: string | null = null
  if (currentChapter) {
    const styledHtml = injectReaderStyles(currentChapter.html, settings)
    const blob = new Blob([styledHtml], { type: "text/html" })
    blobUrl = URL.createObjectURL(blob)
    blobUrlRef.current = blobUrl
  }

  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  const activeTheme = THEMES.find(t => t.value === settings.theme) ?? THEMES[0]

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen"
      style={{ background: isFullscreen ? activeTheme.bg : undefined }}
    >
      {/* ── Header ── */}
      <header className="border-b px-4 py-2 flex items-center gap-2 shrink-0 bg-background/95 backdrop-blur-sm z-10 flex-wrap">
        <span className="text-base font-semibold mr-1">EPUB Viewer</span>

        <label className="cursor-pointer text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground whitespace-nowrap">
          Open file
          <input type="file" accept=".epub" onChange={handleFile} className="sr-only" />
        </label>

        {chapters.length > 0 && (
          <>
            <div className="h-4 w-px bg-border mx-1" />

            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground whitespace-nowrap"
            >
              {sidebarOpen ? "Hide sidebar" : "Chapters"}
            </button>

            <button
              onClick={() => setShowSettings(o => !o)}
              className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors whitespace-nowrap ${
                showSettings
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              Aa Settings
            </button>

            <button
              onClick={toggleFullscreen}
              className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground whitespace-nowrap"
            >
              {isFullscreen ? "⤡ Exit fullscreen" : "⤢ Fullscreen"}
            </button>

            <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
              {currentIndex + 1} / {chapters.length}
            </span>
          </>
        )}
      </header>

      {/* ── Settings panel ── */}
      {showSettings && chapters.length > 0 && (
        <div className="border-b px-6 py-4 bg-muted/30 shrink-0">
          <div className="flex flex-wrap gap-x-8 gap-y-4 items-start">

            {/* Theme swatches */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Theme</p>
              <div className="flex gap-2 items-center">
                {THEMES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => updateSetting("theme", t.value)}
                    title={t.label}
                    className={`w-7 h-7 rounded-full transition-all ${
                      settings.theme === t.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{
                      background: t.bg,
                      boxShadow: `inset 0 0 0 1.5px ${t.text}33`,
                    }}
                  >
                    <span className="sr-only">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font family */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Font</p>
              <select
                value={settings.font}
                onChange={e => updateSetting("font", e.target.value)}
                className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground"
              >
                {FONTS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Font size — {settings.fontSize}px
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSetting("fontSize", Math.max(12, settings.fontSize - 1))}
                  className="w-6 h-6 rounded border border-border hover:bg-muted flex items-center justify-center leading-none"
                  aria-label="Decrease font size"
                >−</button>
                <input
                  type="range" min={12} max={28} step={1}
                  value={settings.fontSize}
                  onChange={e => updateSetting("fontSize", Number(e.target.value))}
                  className="w-24 accent-primary"
                />
                <button
                  onClick={() => updateSetting("fontSize", Math.min(28, settings.fontSize + 1))}
                  className="w-6 h-6 rounded border border-border hover:bg-muted flex items-center justify-center leading-none"
                  aria-label="Increase font size"
                >+</button>
              </div>
            </div>

            {/* Line spacing */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Line spacing — {settings.lineHeight.toFixed(1)}×
              </p>
              <input
                type="range" min={1.2} max={2.4} step={0.1}
                value={settings.lineHeight}
                onChange={e => updateSetting("lineHeight", Number(e.target.value))}
                className="w-28 accent-primary"
              />
            </div>

            {/* Column width */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Width — {settings.maxWidth}px
              </p>
              <input
                type="range" min={400} max={900} step={20}
                value={settings.maxWidth}
                onChange={e => updateSetting("maxWidth", Number(e.target.value))}
                className="w-28 accent-primary"
              />
            </div>

            {/* Reset */}
            <div className="flex items-end pb-0.5">
              <button
                onClick={() => setSettings(DEFAULT_SETTINGS)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Reset defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-6 py-3 text-sm shrink-0">{error}</div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Loading EPUB…
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && chapters.length === 0 && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <span className="text-5xl">📖</span>
          <p className="text-sm">Open an EPUB file to start reading</p>
        </div>
      )}

      {/* ── Reader ── */}
      {!loading && chapters.length > 0 && (
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          {sidebarOpen && (
            <aside className="w-52 border-r overflow-y-auto shrink-0 bg-muted/20">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Contents
              </p>
              {chapters.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-full text-left px-4 py-2 text-xs leading-snug hover:bg-muted transition-colors ${
                    i === currentIndex
                      ? "bg-muted font-semibold text-foreground border-l-2 border-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {ch.title}
                </button>
              ))}
            </aside>
          )}

          {/* Sandboxed iframe — VULN-06: sandbox="" grants no permissions at all */}
          <main className="flex-1 overflow-hidden">
            {blobUrl && (
              <iframe
                key={`${currentIndex}-${JSON.stringify(settings)}`}
                ref={iframeRef}
                src={blobUrl}
                sandbox=""                   // ← no permissions at all
                referrerPolicy="no-referrer"
                className="w-full h-full border-0"
                title={currentChapter?.title ?? "EPUB content"}
              />
            )}
          </main>
        </div>
      )}

      {/* ── Footer nav ── */}
      {!loading && chapters.length > 0 && (
        <footer className="border-t px-6 py-2 flex items-center gap-4 text-sm text-muted-foreground shrink-0 bg-background/95">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(i => i - 1)}
            className="disabled:opacity-30 hover:text-foreground transition-colors px-2 py-1"
          >
            ← Prev
          </button>
          <span className="flex-1 text-center text-xs truncate opacity-60">
            {currentChapter?.title}
          </span>
          <button
            disabled={currentIndex === chapters.length - 1}
            onClick={() => setCurrentIndex(i => i + 1)}
            className="disabled:opacity-30 hover:text-foreground transition-colors px-2 py-1"
          >
            Next →
          </button>
        </footer>
      )}
    </div>
  )
}

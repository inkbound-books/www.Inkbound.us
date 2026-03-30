"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, ChevronLeft, ChevronRight, X, Plus, Minus, Maximize, Minimize, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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

function injectReaderStyles(html: string, settings: ReaderSettings): string {
  const { font, fontSize, lineHeight, theme, maxWidth } = settings

  const themes: Record<string, { bg: string; text: string; link: string; border: string }> = {
    light: { bg: "#ffffff", text: "#1a1a1a", link: "#6d28d9", border: "#e5e7eb" },
    sepia: { bg: "#f8f0e3", text: "#3b2f1e", link: "#7c5c2e", border: "#d4c3a0" },
    dark:  { bg: "#1a1a2e", text: "#e0e0e0", link: "#a78bfa", border: "#374151" },
    gray:  { bg: "#2d2d2d", text: "#d4d4d4", link: "#9ca3af", border: "#4b5563" },
  }
  const t = themes[theme] ?? themes.light

  const fontStacks: Record<string, string> = {
    "Georgia":         "Georgia, 'Times New Roman', serif",
    "Times New Roman": "'Times New Roman', Times, serif",
    "Palatino":        "Palatino, 'Palatino Linotype', 'Book Antiqua', serif",
    "Garamond":        "Garamond, 'EB Garamond', serif",
    "Arial":           "Arial, Helvetica, sans-serif",
    "Verdana":         "Verdana, Geneva, sans-serif",
    "system-ui":       "system-ui, -apple-system, sans-serif",
    "Courier":         "'Courier New', Courier, monospace",
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
    h1, h2, h3, h4, h5, h6 { line-height: 1.3; margin-top: 1.8em; margin-bottom: 0.5em; color: ${t.text}; }
    p { margin: 0 0 1em; }
    a { color: ${t.link}; text-decoration: underline; }
    img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
    pre, code { font-family: 'Courier New', monospace; font-size: 0.88em; overflow-x: auto; }
    blockquote { border-left: 3px solid ${t.link}; margin: 1.5em 0; padding: 0.5em 1em; opacity: 0.85; font-style: italic; }
    hr { border: none; border-top: 1px solid ${t.border}; margin: 2em 0; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid ${t.border}; padding: 0.5em; }
    .center, .centered { text-align: center; }
    .indent { text-indent: 1.5em; }
    .no-indent { text-indent: 0; }
  `

  if (/<head[\s>]/i.test(html)) {
    return html.replace(/(<head[\s>][^>]*>)/i, `$1<style>${css}</style>`)
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`
}

// ─── Robust OPF parser — handles attribute order variations in classic EPUBs
function parseManifest(opfXml: string): Record<string, string> {
  const items: Record<string, string> = {}
  const itemRe = /<item\s[^>]*>/gi
  let match
  while ((match = itemRe.exec(opfXml)) !== null) {
    const tag = match[0]
    const idMatch  = /\bid="([^"]+)"/.exec(tag)
    const hrefMatch = /\bhref="([^"]+)"/.exec(tag)
    const mediaMatch = /\bmedia-type="([^"]+)"/.exec(tag)
    if (idMatch && hrefMatch) {
      const mt = mediaMatch?.[1] ?? ""
      // Only include HTML/XHTML content items
      if (mt.includes("html") || mt.includes("xml") || mt === "" || /\.(html|xhtml|htm)$/i.test(hrefMatch[1])) {
        items[idMatch[1]] = hrefMatch[1]
      }
    }
  }
  return items
}

interface Chapter {
  id: string
  title: string
  html: string
}

interface BookMetadata {
  title: string
  author: string
}

const FONTS = [
  { label: "Georgia (default)", value: "Georgia" },
  { label: "Palatino", value: "Palatino" },
  { label: "Garamond", value: "Garamond" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Arial (sans-serif)", value: "Arial" },
  { label: "Verdana (sans-serif)", value: "Verdana" },
  { label: "System UI", value: "system-ui" },
  { label: "Courier (mono)", value: "Courier" },
]

const THEMES = [
  { label: "Light", value: "light", bg: "#ffffff", text: "#1a1a1a" },
  { label: "Sepia", value: "sepia", bg: "#f8f0e3", text: "#3b2f1e" },
  { label: "Dark",  value: "dark",  bg: "#1a1a2e", text: "#e0e0e0" },
  { label: "Gray",  value: "gray",  bg: "#2d2d2d", text: "#d4d4d4" },
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
  const [metadata, setMetadata] = useState<BookMetadata>({ title: "", author: "" })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const parseAndLoad = useCallback(async (file: File) => {
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

      // Extract metadata
      const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/)
      const authorMatch = opfXml.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/)
      setMetadata({
        title: titleMatch?.[1]?.trim() ?? file.name.replace(".epub", ""),
        author: authorMatch?.[1]?.trim() ?? "Unknown Author",
      })

      const opfBase = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : ""
      const manifestItems = parseManifest(opfXml)
      const spineIds = [...opfXml.matchAll(/<itemref[^>]+idref="([^"]+)"/g)].map(m => m[1])

      const loaded: Chapter[] = []
      for (const id of spineIds) {
        const href = manifestItems[id]
        if (!href) continue
        const fullPath = opfBase + href
        const rawHtml = await zip.file(fullPath)?.async("text")
        if (!rawHtml) continue
        const sanitized = sanitizeEpubHtml(rawHtml)

        const titleMatch2 = sanitized.match(/<title[^>]*>([^<]+)<\/title>/) ??
                            sanitized.match(/<h[12][^>]*>([^<]+)<\/h/)
        const title = titleMatch2?.[1]?.trim() ?? `Chapter ${loaded.length + 1}`
        loaded.push({ id, title, html: sanitized })
      }

      if (loaded.length === 0) throw new Error("No readable chapters found in this EPUB.")
      setChapters(loaded)
      setCurrentIndex(0)
      setIsViewerOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load EPUB.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseAndLoad(file)
  }, [parseAndLoad])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) parseAndLoad(file)
  }, [parseAndLoad])

  const closeBook = () => {
    setIsViewerOpen(false)
    setChapters([])
    setCurrentIndex(0)
    setMetadata({ title: "", author: "" })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  const currentChapter = chapters[currentIndex]
  const progress = chapters.length > 0 ? ((currentIndex + 1) / chapters.length) * 100 : 0

  // Build styled blob for iframe
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

  // ── Upload screen (old UI) ──────────────────────────────────────────────────
  if (!isViewerOpen) {
    return (
      <main className="relative z-10 mx-auto min-h-screen max-w-3xl px-4 pt-32 pb-16 md:px-8">
        <h1 className="mb-4 text-4xl font-semibold text-foreground md:text-5xl">EPUB Viewer</h1>
        <p className="mb-12 text-lg font-light text-muted-foreground">
          Upload an EPUB file to read it in your browser. Your file never leaves your device.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
            Loading EPUB…
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              "cursor-pointer rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center transition-all hover:border-primary hover:bg-background",
              isDragging && "border-primary bg-primary/5"
            )}
          >
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-16 w-16 text-primary" />
              <span className="text-xl font-medium text-foreground">
                Click to upload or drag & drop
              </span>
              <span className="text-muted-foreground">Select an EPUB file to read</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".epub"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </main>
    )
  }

  // ── Reader ─────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-background">
      {/* Progress bar */}
      <div className="h-1 w-full bg-border shrink-0">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background p-3 shrink-0">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground text-sm">
            {metadata.title}{metadata.author ? ` — ${metadata.author}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">{currentChapter?.title}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Font size */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => updateSetting("fontSize", Math.max(12, settings.fontSize - 1))}
              aria-label="Decrease font size"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-[2.5rem] text-center text-sm text-muted-foreground">
              {settings.fontSize}px
            </span>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => updateSetting("fontSize", Math.min(28, settings.fontSize + 1))}
              aria-label="Increase font size"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Settings toggle */}
          <Button
            variant={showSettings ? "default" : "outline"}
            size="icon" className="h-9 w-9"
            onClick={() => setShowSettings(o => !o)}
            aria-label="Reader settings"
          >
            <Settings2 className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="outline" size="icon" className="h-9 w-9"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          <Button
            onClick={() => setCurrentIndex(i => i - 1)}
            disabled={currentIndex === 0}
            size="sm"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>

          <Button
            onClick={() => setCurrentIndex(i => i + 1)}
            disabled={currentIndex >= chapters.length - 1}
            size="sm"
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={closeBook}>
            <X className="mr-1 h-4 w-4" /> Close
          </Button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b px-6 py-4 bg-muted/30 shrink-0 flex flex-wrap gap-x-8 gap-y-4 items-start">
          {/* Theme */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Theme</p>
            <div className="flex gap-2">
              {THEMES.map(t => (
                <button
                  key={t.value}
                  onClick={() => updateSetting("theme", t.value)}
                  title={t.label}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all",
                    settings.theme === t.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                  )}
                  style={{ background: t.bg, boxShadow: `inset 0 0 0 1.5px ${t.text}33` }}
                >
                  <span className="sr-only">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Font</p>
            <select
              value={settings.font}
              onChange={e => updateSetting("font", e.target.value)}
              className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground"
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          {/* Line spacing */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Spacing — {settings.lineHeight.toFixed(1)}×
            </p>
            <input
              type="range" min={1.2} max={2.4} step={0.1}
              value={settings.lineHeight}
              onChange={e => updateSetting("lineHeight", Number(e.target.value))}
              className="w-28 accent-primary"
            />
          </div>

          {/* Width */}
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

          <div className="flex items-end">
            <button
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Reset defaults
            </button>
          </div>
        </div>
      )}

      {/* Sandboxed iframe — VULN-06: sandbox="" grants no permissions at all */}
      <main className="flex-1 overflow-hidden">
        {blobUrl && (
          <iframe
            key={`${currentIndex}-${JSON.stringify(settings)}`}
            ref={iframeRef}
            src={blobUrl}
            sandbox=""
            referrerPolicy="no-referrer"
            className="w-full h-full border-0"
            title={currentChapter?.title ?? "EPUB content"}
          />
        )}
      </main>
    </div>
  )
}

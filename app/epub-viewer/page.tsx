"use client"

import { useState, useRef, useCallback } from "react"
import JSZip from "jszip"

// ─── VULN-06 fix: all EPUB HTML is rendered inside a sandboxed iframe.
// The sandbox attribute grants NO permissions by default — no scripts, no same-origin access,
// no forms, no popups. Content is served as a blob URL so it's isolated from www.inkbound.us.

function sanitizeEpubHtml(raw: string): string {
  // Strip <script> tags and all on* event handler attributes before even handing to the iframe.
  // The sandbox is the primary defense; this is defense-in-depth.
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
}

interface Chapter {
  id: string
  title: string
  html: string
}

export default function EpubViewerPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const blobUrlRef = useRef<string | null>(null)

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setChapters([])

    try {
      const zip = await JSZip.loadAsync(file)

      // Parse OPF to get reading order
      const containerXml = await zip.file("META-INF/container.xml")?.async("text")
      if (!containerXml) throw new Error("Invalid EPUB: missing container.xml")

      const opfPath = containerXml.match(/full-path="([^"]+\.opf)"/)?.[1]
      if (!opfPath) throw new Error("Invalid EPUB: cannot locate OPF file")

      const opfXml = await zip.file(opfPath)?.async("text")
      if (!opfXml) throw new Error("Invalid EPUB: cannot read OPF file")

      const opfBase = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : ""

      // Get spine item hrefs in order
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

        // Extract a readable title from <title> or first <h1>/<h2>
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

  // Render current chapter into sandboxed iframe via blob URL
  const currentChapter = chapters[currentIndex]

  if (blobUrlRef.current) {
    URL.revokeObjectURL(blobUrlRef.current)
    blobUrlRef.current = null
  }

  let blobUrl: string | null = null
  if (currentChapter) {
    const blob = new Blob([currentChapter.html], { type: "text/html" })
    blobUrl = URL.createObjectURL(blob)
    blobUrlRef.current = blobUrl
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-4">
        <h1 className="text-lg font-semibold">EPUB Viewer</h1>
        <input
          type="file"
          accept=".epub"
          onChange={handleFile}
          className="text-sm text-muted-foreground"
        />
      </header>

      {error && (
        <div className="bg-destructive/10 text-destructive px-6 py-3 text-sm">{error}</div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Loading EPUB…
        </div>
      )}

      {!loading && chapters.length > 0 && (
        <div className="flex flex-1 overflow-hidden">
          {/* Chapter list */}
          <aside className="w-56 border-r overflow-y-auto shrink-0">
            {chapters.map((ch, i) => (
              <button
                key={ch.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-full text-left px-4 py-2 text-sm truncate hover:bg-muted transition-colors ${
                  i === currentIndex ? "bg-muted font-medium" : ""
                }`}
              >
                {ch.title}
              </button>
            ))}
          </aside>

          {/* Sandboxed content frame — VULN-06 fix:
              sandbox="" grants nothing. Scripts from the EPUB cannot run,
              cannot access parent origin, cannot open popups, cannot submit forms. */}
          <main className="flex-1 overflow-hidden">
            {blobUrl && (
              <iframe
                ref={iframeRef}
                src={blobUrl}
                sandbox=""                  // ← no permissions at all
                referrerPolicy="no-referrer"
                className="w-full h-full border-0"
                title={currentChapter?.title ?? "EPUB content"}
              />
            )}
          </main>
        </div>
      )}

      {!loading && chapters.length > 0 && (
        <footer className="border-t px-6 py-3 flex items-center gap-4 text-sm text-muted-foreground">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(i => i - 1)}
            className="disabled:opacity-40"
          >
            ← Prev
          </button>
          <span>
            {currentIndex + 1} / {chapters.length}
          </span>
          <button
            disabled={currentIndex === chapters.length - 1}
            onClick={() => setCurrentIndex(i => i + 1)}
            className="disabled:opacity-40"
          >
            Next →
          </button>
        </footer>
      )}
    </div>
  )
}

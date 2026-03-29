import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function VisualEditLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  // Check admin session
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (session?.value !== "authenticated") {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Editor header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/pages">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pages
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-sm font-medium">Visual Editor</h1>
            <p className="text-xs text-muted-foreground">
              Editing: <span className="font-mono">{slug}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Click any text to edit it inline
          </span>
        </div>
      </div>

      {/* Page content with padding for header */}
      <div className="pt-16">
        {children}
      </div>
    </div>
  )
}

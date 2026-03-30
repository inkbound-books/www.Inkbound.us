import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { PagesManager } from "@/components/admin/pages-manager"
import { getNavLinks } from "@/app/admin/actions"

export default async function AdminPagesPage() {
  const supabase = await createClient()
  const { data: pages } = await supabase
    .from("pages")
    .select("*")
    .order("slug", { ascending: true })

  const navLinks = await getNavLinks()
  const navLinkProps = navLinks.map(({ label, href }) => ({ label, href }))

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="pl-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Pages</h1>
            <p className="text-muted-foreground">Create, edit, and manage your website pages</p>
          </div>

          <PagesManager pages={pages || []} initialNavLinks={navLinkProps} />
        </div>
      </main>
    </div>
  )
}

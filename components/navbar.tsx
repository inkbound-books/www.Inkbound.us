import { getNavLinks } from "@/app/admin/actions"
import { NavbarClient } from "./navbar-client"

// Hardcoded fallback — used if the DB table doesn't exist yet or returns empty
const FALLBACK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/catalog", label: "Catalog" },
  { href: "/formats", label: "Supported Formats" },
  { href: "/epub-viewer", label: "EPUB Viewer" },
]

// Server component — fetches links, hands off interactivity to client component
export async function Navbar() {
  const dbLinks = await getNavLinks()
  const navLinks =
    dbLinks.length > 0
      ? dbLinks.map(({ label, href }) => ({ label, href }))
      : FALLBACK_LINKS

  return <NavbarClient links={navLinks} />
}

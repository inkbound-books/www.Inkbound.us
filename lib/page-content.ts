import { createClient } from "@/lib/supabase/server"

// Type definitions for page content sections
export interface HomePageContent {
  hero: {
    title: string
    subtitle: string
  }
  purchasing: {
    intro: string
    email: string
    subject: string
    contentItems: string[]
  }
  formats: {
    text: string
    fallbackText: string
  }
}

export interface AboutPageContent {
  hero: {
    title: string
  }
  intro: {
    paragraph1: string
    paragraph2: string
  }
  contact: {
    title: string
    description: string
    contacts: Array<{ title: string; email: string }>
    businessNote: string
    footer?: string
  }
  closing: {
    text: string
  }
}

export interface CatalogPageContent {
  hero: {
    title: string
    subtitle: string
  }
  emptyState: {
    title: string
    subtitle: string
  }
}

export interface FormatsPageContent {
  hero: {
    title: string
    subtitle: string
  }
  recommendation: {
    title: string
    text: string
  }
  closing: {
    paragraph1: string
    paragraph2: string
  }
}

// Default content for fallback
export const defaultHomeContent: HomePageContent = {
  hero: {
    title: "Welcome to Inkbound Books",
    subtitle: "We are a small team dedicated to writing and editing books.",
  },
  purchasing: {
    intro: "We currently sell E-books only. To purchase a book, please browse our catalog and then email us using the format below.",
    email: "inkbound.business@proton.me",
    subject: "Purchase Book",
    contentItems: ["Book Name", "E-book Format", "Payment ID (if applicable)"],
  },
  formats: {
    text: "We support a limited range of E-book formats. You can view the supported formats here.",
    fallbackText: "If you need a different format, include a request in your email and we will try to fulfill it. If we are unable to do so, you will be provided with an EPUB file, which you may convert on your own.",
  },
}

export const defaultAboutContent: AboutPageContent = {
  hero: {
    title: "About Inkbound",
  },
  intro: {
    paragraph1: "We are a two-person team consisting of a main author and an editor/developer.",
    paragraph2: "Our passion lies in crafting compelling stories and ensuring they are presented with the highest quality. Every book we publish goes through a meticulous writing and editing process to deliver the best reading experience possible.",
  },
  contact: {
    title: "Get in Touch",
    description: "You can reach out to us via email:",
    contacts: [
      { title: "Author", email: "inkbound.author@proton.me" },
      { title: "Editor/Developer", email: "inkbound.editor@proton.me" },
      { title: "Business Inquiries", email: "inkbound.business@proton.me" },
    ],
    businessNote: "For business inquiries and book purchases, please use the business email listed above.",
    footer: "For <span class=\"font-medium text-primary\">business inquiries and book purchases</span>, please use the business email listed above.",
  },
  closing: {
    text: "We appreciate your interest in Inkbound Books and look forward to sharing our stories with you!",
  },
}

export const defaultCatalogContent: CatalogPageContent = {
  hero: {
    title: "Our Books",
    subtitle: "Browse our collection of quality e-books",
  },
  emptyState: {
    title: "Coming Soon!",
    subtitle: "Our catalog is currently being prepared. Check back soon for available books.",
  },
}

export const defaultFormatsContent: FormatsPageContent = {
  hero: {
    title: "Supported E-Book Formats",
    subtitle: "We offer our books in multiple formats for your convenience",
  },
  recommendation: {
    title: "Recommended Format",
    text: "We highly recommend EPUB as it is the most widely supported and reliable format across different devices and e-readers. EPUB files maintain proper formatting, support rich text features, and provide the best reading experience.",
  },
  closing: {
    paragraph1: "If you need a format not listed here, please include your request in your purchase email. We will do our best to accommodate your needs.",
    paragraph2: "If we are unable to provide your requested format, you will receive an EPUB file that you can convert using free tools such as Calibre.",
  },
}

// Fetch page content from Supabase
export async function getPageContent<T>(slug: string, defaultContent: T): Promise<T> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("pages")
      .select("content")
      .eq("slug", slug)
      .single()

    if (error || !data?.content) {
      return defaultContent
    }

    // Merge with defaults to ensure all fields exist
    return { ...defaultContent, ...data.content } as T
  } catch {
    return defaultContent
  }
}

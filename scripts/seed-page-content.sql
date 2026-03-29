-- Seed page content for visual editing
-- This upserts content for existing pages (Home, About, Catalog, Formats)

-- Home Page
INSERT INTO pages (slug, title, content, meta_description)
VALUES (
  'home',
  'Welcome to Inkbound Books',
  '{
    "hero": {
      "title": "Welcome to Inkbound Books",
      "subtitle": "We are a small team dedicated to writing and editing books."
    },
    "intro": {
      "text": "We currently sell E-books only. To purchase a book, please browse our catalog and then email us using the format below."
    },
    "contact": {
      "email": "inkbound.business@proton.me",
      "subject": "Purchase Book",
      "instructions": ["Book Name", "E-book Format", "Payment ID (if applicable)"]
    },
    "formatNote": {
      "text": "We support a limited range of E-book formats. You can view the supported formats on our formats page.",
      "fallback": "If you need a different format, include a request in your email and we will try to fulfill it. If we are unable to do so, you will be provided with an EPUB file, which you may convert on your own."
    }
  }'::jsonb,
  'Inkbound Books - A small team dedicated to writing and editing quality e-books.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  updated_at = now();

-- About Page
INSERT INTO pages (slug, title, content, meta_description)
VALUES (
  'about',
  'About Inkbound',
  '{
    "hero": {
      "title": "About Inkbound"
    },
    "intro": {
      "paragraph1": "We are a two-person team consisting of a main author and an editor/developer.",
      "paragraph2": "Our passion lies in crafting compelling stories and ensuring they are presented with the highest quality. Every book we publish goes through a meticulous writing and editing process to deliver the best reading experience possible."
    },
    "contacts": [
      { "title": "Author", "email": "inkbound.author@proton.me" },
      { "title": "Editor/Developer", "email": "inkbound.editor@proton.me" },
      { "title": "Business Inquiries", "email": "inkbound.business@proton.me" }
    ],
    "contactNote": "For business inquiries and book purchases, please use the business email listed above.",
    "closing": "We appreciate your interest in Inkbound Books and look forward to sharing our stories with you!"
  }'::jsonb,
  'Learn about the Inkbound Books team - a two-person team of authors and editors.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  updated_at = now();

-- Catalog Page
INSERT INTO pages (slug, title, content, meta_description)
VALUES (
  'catalog',
  'Our Books',
  '{
    "hero": {
      "title": "Our Books",
      "subtitle": "Browse our collection of quality e-books"
    },
    "emptyState": {
      "title": "Coming Soon!",
      "message": "Our catalog is currently being prepared. Check back soon for available books."
    }
  }'::jsonb,
  'Browse our collection of e-books available for purchase.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  updated_at = now();

-- Formats Page
INSERT INTO pages (slug, title, content, meta_description)
VALUES (
  'formats',
  'Supported E-Book Formats',
  '{
    "hero": {
      "title": "Supported E-Book Formats",
      "subtitle": "We offer our books in multiple formats for your convenience"
    },
    "recommendation": {
      "title": "Recommended Format",
      "text": "We highly recommend EPUB as it is the most widely supported and reliable format across different devices and e-readers. EPUB files maintain proper formatting, support rich text features, and provide the best reading experience."
    },
    "customRequest": {
      "paragraph1": "If you need a format not listed here, please include your request in your purchase email. We will do our best to accommodate your needs.",
      "paragraph2": "If we are unable to provide your requested format, you will receive an EPUB file that you can convert using free tools such as Calibre."
    },
    "emptyState": "Format information coming soon."
  }'::jsonb,
  'View the e-book formats we support for our digital books.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  updated_at = now();

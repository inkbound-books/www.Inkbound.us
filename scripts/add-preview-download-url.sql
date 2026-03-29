-- Add preview_download_url column to books table
-- This column stores an external URL where users can download a preview of the book

ALTER TABLE books ADD COLUMN IF NOT EXISTS preview_download_url text;

-- Add a comment for documentation
COMMENT ON COLUMN books.preview_download_url IS 'External URL for book preview download (e.g., Google Drive, Dropbox link)';

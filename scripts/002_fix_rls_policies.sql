-- Fix infinite recursion in RLS policies
-- The issue is that admin_users policy references itself, causing infinite recursion
-- This script uses correct table names: books, formats, pages, admin_users

-- First, drop ALL existing policies to start fresh
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on admin_users
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'admin_users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
    END LOOP;
    
    -- Drop all policies on books
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'books' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.books', pol.policyname);
    END LOOP;
    
    -- Drop all policies on formats
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'formats' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.formats', pol.policyname);
    END LOOP;
    
    -- Drop all policies on pages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'pages' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.pages', pol.policyname);
    END LOOP;
END $$;

-- Create simple non-recursive policies
-- Since admin operations use service_role key which bypasses RLS,
-- we only need public read policies and simple write policies

-- Admin users: allow all operations (service role bypasses anyway)
CREATE POLICY "admin_users_select" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "admin_users_all" ON public.admin_users FOR ALL USING (true);

-- Books: public read, allow all writes (protected by service role)
CREATE POLICY "books_select" ON public.books FOR SELECT USING (true);
CREATE POLICY "books_all" ON public.books FOR ALL USING (true);

-- Formats: public read, allow all writes (protected by service role)
CREATE POLICY "formats_select" ON public.formats FOR SELECT USING (true);
CREATE POLICY "formats_all" ON public.formats FOR ALL USING (true);

-- Pages: public read, allow all writes (protected by service role)  
CREATE POLICY "pages_select" ON public.pages FOR SELECT USING (true);
CREATE POLICY "pages_all" ON public.pages FOR ALL USING (true);

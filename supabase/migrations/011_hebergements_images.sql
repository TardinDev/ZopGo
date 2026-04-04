-- Migration: Images for hebergements
-- Description: Add images column to hebergements table and create storage bucket

-- Add images column to hebergements table
ALTER TABLE hebergements ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Create hebergements storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hebergements',
  'hebergements',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read hebergement images (public bucket)
CREATE POLICY "Public hebergement images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'hebergements');

-- Allow authenticated users to upload hebergement images
CREATE POLICY "Authenticated users can upload hebergement images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hebergements'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update hebergement images
CREATE POLICY "Authenticated users can update hebergement images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hebergements'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete hebergement images
CREATE POLICY "Authenticated users can delete hebergement images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hebergements'
  AND auth.role() = 'authenticated'
);

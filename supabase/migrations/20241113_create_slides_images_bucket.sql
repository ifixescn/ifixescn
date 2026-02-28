/*
# Create Slides Images Storage Bucket

## Purpose
Create a dedicated Supabase Storage bucket for storing slide images with appropriate policies.

## Bucket Configuration
- Name: app-7fshtpomqha9_slides_images
- Public access: Enabled (for displaying images)
- File size limit: 1MB (enforced on frontend)
- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/avif

## Security Policies
- Public read access: All users can view images
- Upload access: Admins only (using is_admin function)
- Delete access: Admins only

## Notes
- Frontend will handle automatic compression for files > 1MB
- Images will be converted to WEBP format with quality 0.8
- Maximum resolution: 1080p (preserving aspect ratio)
*/

-- Create the slides images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-7fshtpomqha9_slides_images',
  'app-7fshtpomqha9_slides_images',
  true,
  1048576, -- 1MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to all images
CREATE POLICY "Public read access for slide images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-7fshtpomqha9_slides_images');

-- Policy: Allow admins to upload images
CREATE POLICY "Admins can upload slide images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-7fshtpomqha9_slides_images' 
  AND is_admin(auth.uid())
);

-- Policy: Allow admins to update images
CREATE POLICY "Admins can update slide images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'app-7fshtpomqha9_slides_images' 
  AND is_admin(auth.uid())
);

-- Policy: Allow admins to delete images
CREATE POLICY "Admins can delete slide images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'app-7fshtpomqha9_slides_images' 
  AND is_admin(auth.uid())
);

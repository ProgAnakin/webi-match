-- Hardens the `product-images` Storage bucket.
--
-- The bucket is public-READ on purpose — the kiosk renders product images via
-- their public URL. But writing (upload / overwrite / delete) must be limited
-- to managers: with the junior `consulente` role now able to log in, an
-- "authenticated"-only upload policy would let any consultant replace product
-- images. This aligns Storage with the catalog tables, which are manager-only.
--
-- Replaces the old `auth_upload` / `auth_update` policies. `public_read`
-- (SELECT) is intentionally left untouched.

DROP POLICY IF EXISTS "auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "auth_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_manager_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_manager_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_manager_delete" ON storage.objects;

CREATE POLICY "product_images_manager_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid() AND sr.role = 'manager'
    )
  );

CREATE POLICY "product_images_manager_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid() AND sr.role = 'manager'
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid() AND sr.role = 'manager'
    )
  );

-- DELETE so a manager can clean up images of removed products.
CREATE POLICY "product_images_manager_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.store_roles sr
      WHERE sr.user_id = auth.uid() AND sr.role = 'manager'
    )
  );

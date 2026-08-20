
CREATE POLICY "Authenticated can view apartment photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'apartment-photos');

CREATE POLICY "Hosts and admins can upload apartment photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'apartment-photos'
    AND (public.has_role(auth.uid(), 'host') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Owners and admins can update apartment photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'apartment-photos'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Owners and admins can delete apartment photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'apartment-photos'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  path: string | null | undefined;
  className?: string;
  alt?: string;
  bucket?: string;
}

export function SignedImage({ path, className, alt = "", bucket = "apartment-photos" }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("signed url error", error);
          setUrl(null);
        } else {
          setUrl(data?.signedUrl ?? null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path, bucket]);

  if (!url) {
    return <div className={`${className ?? ""} bg-muted`} aria-label={alt} />;
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}

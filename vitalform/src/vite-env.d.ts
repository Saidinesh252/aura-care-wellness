/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly NEXT_PUBLIC_SUPABASE_URL?: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly VITE_AFFILIATE_AMAZON_TAG?: string;
  readonly VITE_AFFILIATE_FLIPKART_AFFID?: string;
  readonly VITE_AFFILIATE_NYKAA_TAG?: string;
  readonly VITE_AFFILIATE_1MG_TAG?: string;
  readonly VITE_AFFILIATE_PHARMEASY_TAG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

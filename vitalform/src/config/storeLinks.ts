// Centralized Affiliate & Store Link Configuration

export type StorePlatform =
  | 'Amazon India'
  | 'Flipkart'
  | 'Nykaa'
  | 'Tata 1mg'
  | 'PharmEasy'
  | 'Decathlon'
  | 'BigBasket'
  | 'General';

export interface AffiliateConfig {
  amazonTag: string;
  flipkartAffId: string;
  nykaaTag: string;
  oneMgTag: string;
  pharmEasyTag: string;
}

// Read affiliate tags from environment variables (.env.local)
export const affiliateConfig: AffiliateConfig = {
  amazonTag: (import.meta.env.VITE_AFFILIATE_AMAZON_TAG as string | undefined)?.trim() ?? '',
  flipkartAffId: (import.meta.env.VITE_AFFILIATE_FLIPKART_AFFID as string | undefined)?.trim() ?? '',
  nykaaTag: (import.meta.env.VITE_AFFILIATE_NYKAA_TAG as string | undefined)?.trim() ?? '',
  oneMgTag: (import.meta.env.VITE_AFFILIATE_1MG_TAG as string | undefined)?.trim() ?? '',
  pharmEasyTag: (import.meta.env.VITE_AFFILIATE_PHARMEASY_TAG as string | undefined)?.trim() ?? '',
};

/**
 * Builds a clean, monetization-ready store URL with active affiliate tags
 * Handles both direct product URLs and keyword search queries
 */
export function buildStoreUrl(
  platform: StorePlatform | string,
  queryOrUrl: string,
  customTag?: string
): string {
  const isUrl = /^https?:\/\//i.test(queryOrUrl);

  // If already a direct URL, append/update affiliate query parameters
  if (isUrl) {
    try {
      const url = new URL(queryOrUrl);

      if (url.hostname.includes('amazon')) {
        const tag = customTag || affiliateConfig.amazonTag;
        if (tag) url.searchParams.set('tag', tag);
        return url.toString();
      }

      if (url.hostname.includes('flipkart')) {
        const affid = customTag || affiliateConfig.flipkartAffId;
        if (affid) url.searchParams.set('affid', affid);
        return url.toString();
      }

      if (url.hostname.includes('nykaa')) {
        const tag = customTag || affiliateConfig.nykaaTag;
        if (tag) {
          url.searchParams.set('utm_source', tag);
          url.searchParams.set('utm_medium', 'affiliate');
        }
        return url.toString();
      }

      if (url.hostname.includes('1mg')) {
        const tag = customTag || affiliateConfig.oneMgTag;
        if (tag) {
          url.searchParams.set('utm_source', tag);
          url.searchParams.set('utm_medium', 'affiliate');
        }
        return url.toString();
      }

      if (url.hostname.includes('pharmeasy')) {
        const tag = customTag || affiliateConfig.pharmEasyTag;
        if (tag) {
          url.searchParams.set('utm_source', tag);
        }
        return url.toString();
      }

      return url.toString();
    } catch {
      return queryOrUrl;
    }
  }

  // Otherwise, construct a sanitized search URL for the retailer
  const query = encodeURIComponent(queryOrUrl.replaceAll('·', ' ').trim());

  switch (platform) {
    case 'Amazon India':
    case 'Amazon': {
      const tag = customTag || affiliateConfig.amazonTag;
      return `https://www.amazon.in/s?k=${query}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`;
    }

    case 'Flipkart': {
      const affid = customTag || affiliateConfig.flipkartAffId;
      return `https://www.flipkart.com/search?q=${query}${affid ? `&affid=${encodeURIComponent(affid)}` : ''}`;
    }

    case 'Nykaa': {
      const tag = customTag || affiliateConfig.nykaaTag;
      return `https://www.nykaa.com/search/result/?q=${query}${tag ? `&utm_source=${encodeURIComponent(tag)}&utm_medium=affiliate` : ''}`;
    }

    case 'Tata 1mg':
    case '1mg': {
      const tag = customTag || affiliateConfig.oneMgTag;
      return `https://www.1mg.com/search/all?name=${query}${tag ? `&utm_source=${encodeURIComponent(tag)}&utm_medium=affiliate` : ''}`;
    }

    case 'PharmEasy': {
      const tag = customTag || affiliateConfig.pharmEasyTag;
      return `https://pharmeasy.in/search/all?name=${query}${tag ? `&utm_source=${encodeURIComponent(tag)}` : ''}`;
    }

    case 'Decathlon':
      return `https://www.decathlon.in/search?query=${query}`;

    case 'BigBasket':
      return `https://www.bigbasket.com/ps/?q=${query}`;

    default:
      return `https://www.google.com/search?q=${query}`;
  }
}

import { type Product, type ReviewSource } from './products';
import { buildStoreUrl } from './config/storeLinks';

export type BuyLink = { name: string; url: string; type: 'product' | 'search' | 'information' };

function retailerProduct(source: ReviewSource): BuyLink | undefined {
  const url = new URL(source.url);
  const path = url.pathname;
  switch (source.retailer) {
    case 'Nykaa': if (/\/(?:p|reviews)\/\d+\/?$/.test(path)) url.pathname = path.replace('/reviews/', '/p/'); else return; break;
    case 'Decathlon': if (/^\/(?:p|reviews)\/\d+\//.test(path)) url.pathname = path.replace(/^\/reviews\//, '/p/'); else return; break;
    case 'BigBasket': if (/^\/(?:pd|product-reviews)\/\d+\//.test(path)) url.pathname = path.replace(/^\/product-reviews\//, '/pd/'); else return; break;
    case 'Flipkart': if (/\/(?:p|product-reviews)\/itm[\da-z]+\/?$/.test(path)) url.pathname = path.replace('/product-reviews/', '/p/'); else return; break;
    case 'Tata 1mg': if (!path.startsWith('/otc/')) return; break;
    default: if (!/\/(?:product|products|sv)\//.test(path)) return;
  }
  return { name: source.retailer, url: buildStoreUrl(source.retailer, url.toString()), type: 'product' };
}

export function shoppingLinks(product: Product): BuyLink[] {
  const query = `${product.brand} ${product.name} ${product.pack}`.replaceAll('·', ' ');
  const links: BuyLink[] = [
    ...product.sources.flatMap(source => {
      const link = retailerProduct(source);
      return link ? [link] : [];
    }),
    ...(product.storeLinks ?? []).map(link => ({
      name: link.name,
      url: buildStoreUrl(link.name, link.url),
      type: link.name.endsWith('information') ? 'information' as const : 'product' as const,
    })),
    { name: 'Amazon India', url: buildStoreUrl('Amazon India', query), type: 'search' },
    { name: 'Flipkart', url: buildStoreUrl('Flipkart', query), type: 'search' },
  ];
  if (product.pillar === 'skin') links.push({ name: 'Nykaa', url: buildStoreUrl('Nykaa', query), type: 'search' });
  if (product.pillar !== 'fitness') links.push({ name: 'Tata 1mg', url: buildStoreUrl('Tata 1mg', query), type: 'search' });
  return links.filter((link, index) => links.findIndex(other => other.name === link.name) === index);
}

import { type Pillar } from './context';
import { type Product } from './products';

export const catalogKinds = {
  cleanser: { name: 'Gentle cleansers', pillar: 'skin' },
  serum: { name: 'Treatment serums', pillar: 'skin' },
  moisturizer: { name: 'Face moisturizers', pillar: 'skin' },
  sunscreen: { name: 'Sunscreens', pillar: 'skin' },
  lipBalm: { name: 'Lip balms', pillar: 'skin' },
  shampoo: { name: 'Hard-water shampoos', pillar: 'skin' },
  natural: { name: 'DIY & botanical care', pillar: 'skin' },
  bands: { name: 'Resistance bands', pillar: 'fitness' },
  mats: { name: 'Non-slip mats', pillar: 'fitness' },
  strength: { name: 'Strength equipment', pillar: 'fitness' },
  grips: { name: 'Grips & hand trainers', pillar: 'fitness' },
  rollers: { name: 'Rollers & massage tools', pillar: 'fitness' },
  pedals: { name: 'Seated pedal exercisers', pillar: 'fitness' },
  scales: { name: 'Smart scales', pillar: 'fitness' },
  whey: { name: 'Whey protein', pillar: 'diet' },
  plant: { name: 'Plant protein', pillar: 'diet' },
  oats: { name: 'Oats & breakfast grains', pillar: 'diet' },
  spreads: { name: 'Nut butters', pillar: 'diet' },
  seeds: { name: 'Chia & flax seeds', pillar: 'diet' },
  snacks: { name: 'Whole-food snacks', pillar: 'diet' },
  hydration: { name: 'Electrolytes', pillar: 'diet' },
  vitamins: { name: 'Multivitamins', pillar: 'diet' },
  omega: { name: 'Omega-3', pillar: 'diet' },
  seniorNutrition: { name: 'Adult nutrition drinks', pillar: 'diet' },
  performance: { name: 'Performance supplements', pillar: 'diet' },
} as const satisfies Record<string, { name: string; pillar: Pillar }>;

export type CatalogKind = keyof typeof catalogKinds;

const legacyKinds: Readonly<Record<string, CatalogKind>> = {
  'domyos-grip': 'grips', 'domyos-grips': 'grips', 'decathlon-ball': 'rollers', 'kimjaly-mat': 'mats',
  'corength-band': 'bands', 'domyos-band-kit': 'bands', 'quaker-oats': 'oats', 'pintola-organic': 'spreads',
  'pro-nature-chana': 'snacks', 'fastup-reload': 'hydration', 'mb-creamp': 'performance',
};

export function productKind(product: Product): CatalogKind {
  const explicit = product.kind ?? legacyKinds[product.id];
  if (explicit) return explicit;
  if (product.pillar === 'skin') {
    switch (product.slot) {
      case 'Cleanse': return 'cleanser';
      case 'Treat': return 'serum';
      case 'Moisturize': return 'moisturizer';
      case 'Protect': return 'sunscreen';
      case 'Haircare': return 'shampoo';
      case 'LipCare': return 'lipBalm';
      default: return 'natural';
    }
  }
  if (product.pillar === 'fitness') return 'strength';
  return product.diet === 'dairy' ? 'whey' : 'plant';
}

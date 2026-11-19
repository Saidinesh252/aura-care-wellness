import { type Budget, type DiscoveryItem, type Macros, type Pillar, type SkinType, skinTypes } from './context';
import { type Exclusion, type FitnessGoal, type SkinConcern, type UserBioProfile } from './profile';
import { safetyFor } from './safety';
import { type CatalogKind, productKind } from './catalogKinds';
import { catalogAdditions } from './catalogAdditions';

export const catalogDate = '18 Nov 2026';
export type ProductSlot = 'Cleanse' | 'Hydrate' | 'Treat' | 'Moisturize' | 'Protect' | 'Haircare' | 'LipCare' | 'Workout' | 'Breakfast' | 'Snack' | 'Hydration';
export interface ReviewSource { retailer: string; url: string; stars: number; count: number; verified: boolean; unit: 'ratings' | 'reviews' }
export interface ProductStoreLink { name: string; url: string }
export interface Product {
  id: string;
  brand: string;
  name: string;
  pack: string;
  pillar: Pillar;
  slot: ProductSlot;
  price: number;
  dorm: boolean;
  spec: string[];
  sources: ReviewSource[];
  positives: [string, string];
  drawback: string;
  fromReviews?: boolean;
  criticalReview?: boolean;
  skin?: readonly SkinType[];
  concerns?: SkinConcern[];
  natural?: boolean;
  goals?: FitnessGoal[];
  diet?: 'plant' | 'dairy' | 'unclear';
  jain?: boolean;
  allergens?: Exclusion[];
  adult?: boolean;
  fitKey?: string;
  units?: number;
  serving?: { size: string; macros: Macros };
  labelProtein?: number;
  kind?: CatalogKind;
  storeLinks?: ProductStoreLink[];
  clinicianReview?: boolean;
}

function source(retailer: string, url: string, stars: number, count: number, verified = false, unit: ReviewSource['unit'] = 'ratings'): ReviewSource {
  return { retailer, url, stars, count, verified, unit };
}
const nykaa = (path: string, stars: number, count: number) => source('Nykaa', `https://www.nykaa.com/${path}`, stars, count, true);
const decathlon = (path: string, stars: number, count: number) => source('Decathlon', `https://www.decathlon.in/${path}`, stars, count, false, 'reviews');
const healthkart = (path: string, stars: number, count: number) => source('HealthKart', `https://www.healthkart.com/sv/${path}`, stars, count);
const bigbasket = (path: string, stars: number, count: number) => source('BigBasket', `https://www.bigbasket.com/${path}`, stars, count, false);
const drySkin = ['Dry', 'Sensitive', 'Normal'] as const;
const oilSkin = ['Oily', 'Combination'] as const;
const activeGoals: FitnessGoal[] = ['gain', 'recomp'];
const peaSources = [
  healthkart('nutrabay-gold-pea-protein/SP-138425?navKey=VRNT-278113', 4.6, 32),
  source('Nutrabay', 'https://nutrabay.com/product/nutrabay-gold-hydrolyzed-pea-protein/?pId=3302532&vId=1313267', 4.4, 3398),
];
const wheySource = healthkart('muscleblaze-biozyme-performance-whey/SP-84971?navKey=VRNT-162363', 4.4, 4012);
const wheyNotes = {
  positives: ['Rich chocolate flavor gets praise', 'Several customers report easy mixing'] as [string, string],
  drawback: 'Some customers report clumping or weaker mixability.', fromReviews: true, criticalReview: true,
};
const peaNotes = {
  positives: ['Retailer review summary highlights chocolate flavor', 'Reviewers mention it mixes readily'] as [string, string],
  drawback: 'Contains sweetener. Check the current ingredient and cross-contact statements.',
  fromReviews: true, labelProtein: 25,
};

export const products: Product[] = [
  {
    id: 'himalaya-aloe', brand: 'Himalaya', name: 'Moisturizing Aloe Vera Face Gel', pack: '100 ml', price: 79,
    pillar: 'skin', slot: 'Hydrate', dorm: true, natural: true, skin: ['Normal', 'Oily', 'Combination'], fitKey: 'aloe-gel', units: 100,
    spec: ['Aloe vera gel with vitamin C', 'Leave-on face gel'],
    sources: [nykaa('himalaya-moisturizin-aloe-vera-face-gel/reviews/2671829', 4.4, 29354)],
    positives: ['Light gel feel', 'Low-cost format'], drawback: 'The formula has added ingredients. Check the fragrance declaration if you react to fragrance.',
  },
  {
    id: 'wishcare-aloe', brand: 'WishCare', name: 'Aloe Vera Face & Hair Gel', pack: '200 ml', price: 267,
    pillar: 'skin', slot: 'Hydrate', dorm: true, natural: true, skin: ['Dry', 'Normal', 'Oily', 'Combination'], fitKey: 'aloe-gel', units: 200,
    spec: ['Aloe vera and vitamin E', 'Face and hair gel'],
    sources: [nykaa('wishcare-pure-natural-aloe-vera-gel-enriched-with-vitamin-e/reviews/603481', 4.4, 6442)],
    positives: ['One gel for face and hair', 'Lightweight water-based format'], drawback: 'A separate moisturizer may be useful for dry skin.',
  },
  {
    id: 'himalaya-neem', brand: 'Himalaya', name: 'Purifying Neem Face Wash', pack: '200 ml', price: 374,
    pillar: 'skin', slot: 'Cleanse', dorm: true, natural: true, skin: oilSkin, fitKey: 'gel-cleanser', units: 200,
    spec: ['Neem and turmeric', 'Rinse-off cleansing gel'],
    sources: [nykaa('himalaya-purifying-neem-face-wash/reviews/592540', 4.5, 156334)],
    positives: ['Gel format for oily skin', 'Botanical wash-off option'], drawback: 'Botanical extracts and fragrance may be a poor fit for reactive skin.',
  },
  {
    id: 'cetaphil-gentle', brand: 'Cetaphil', name: 'Gentle Skin Cleanser', pack: '118 ml', price: 399,
    pillar: 'skin', slot: 'Cleanse', dorm: true, skin: [...drySkin, 'Combination'], fitKey: 'gentle-cleanser', units: 118,
    spec: ['Glycerin, panthenol and niacinamide', 'Low-foam, fragrance-free cleanser'],
    sources: [nykaa('cetaphil-cleansing-lotion/reviews/22032', 4.5, 445411)],
    positives: ['Gentle feel during cleansing', 'Leaves dry skin feeling comfortable'], fromReviews: true,
    drawback: 'A low-foam wash can feel light if you prefer a foaming cleanser.',
  },
  {
    id: 'minimalist-niacinamide', brand: 'Minimalist', name: '10% Niacinamide Face Serum', pack: '10 ml', price: 249,
    pillar: 'skin', slot: 'Treat', dorm: true, adult: true, skin: oilSkin, concerns: ['Acne & breakouts', 'Dark spots / hyperpigmentation', 'Dullness & uneven texture'], fitKey: 'niacinamide', units: 10,
    spec: ['10% niacinamide with zinc and Matmarine', 'Leave-on serum for oily and combination skin'],
    sources: [nykaa('minimalist-10-niacinamide-face-serum-with-matmarine-zinc-for-reducing-oil-blemishes/reviews/15022069', 4.4, 130302)],
    storeLinks: [{ name: 'Minimalist official store', url: 'https://beminimalist.co/products/niacinamide-10-with-matmarine' }],
    positives: ['Buyers describe less visible shine', 'Some report uneven marks looking better over time'], fromReviews: true,
    drawback: 'Allow time to assess tolerance and appearance. Some reviewers describe slow changes.',
  },
  {
    id: 'minimalist-bha', brand: 'Minimalist', name: '2% Salicylic Acid Face Serum', pack: '30 ml', price: 549,
    pillar: 'skin', slot: 'Treat', dorm: true, adult: true, skin: oilSkin, concerns: ['Acne & breakouts'], fitKey: 'salicylic-2', units: 30,
    spec: ['2% salicylic acid (BHA)', 'Leave-on exfoliant'],
    sources: [nykaa('minimalist-salicylic-acid-2-serum/reviews/15973485', 4.4, 92085)],
    storeLinks: [{ name: 'Minimalist official store', url: 'https://beminimalist.co/products/salicylic-acid-2' }],
    positives: ['Some reviewers mention fewer visible blackheads', 'Buyers mention liking the light texture'], fromReviews: true,
    drawback: 'Can dry or sting. Keep separate from retinoids and other exfoliants.',
  },
  {
    id: 'reequil-matte', brand: 'Re’equil', name: 'Ultra Matte Dry Touch Sunscreen', pack: '50 g', price: 581,
    pillar: 'skin', slot: 'Protect', dorm: true, skin: oilSkin, concerns: ['Tanning / sun damage'], fitKey: 'spf50-pa4', units: 50,
    spec: ['SPF 50 and PA++++', 'Non-comedogenic claim on retailer listing', 'Matte silicone gel'],
    sources: [
      nykaa('re-equil-ultra-matte-dry-touch-sunscreen-gel-spf-50/reviews/8425811?skuId=528137', 4.4, 62236),
      source('Flipkart', 'https://www.flipkart.com/re-equil-sunscreen-spf-50-pa-ultra-matte-dry-touch-gel/product-reviews/itm39d547bb7b9e0', 4.4, 16039),
    ],
    storeLinks: [{ name: 'Re’equil official store', url: 'https://www.reequil.com/products/ultra-matte-dry-touch-sunscreen-gel-spf-50-pa/1000' }],
    positives: ['Velvety matte finish on oily skin', 'Several reviewers like the non-sticky feel'], fromReviews: true,
    drawback: 'Some users describe a white cast or a heavier silicone feel at first.',
  },
  {
    id: 'miloe-mineral', brand: 'Miloé', name: 'Mineral Melt Hard Water Shampoo', pack: '200 ml', price: 499,
    pillar: 'skin', slot: 'Haircare', dorm: true, fitKey: 'chelating-shampoo', units: 200,
    spec: ['Sodium gluconate chelator', '2% apple cider vinegar and 0.5% BHA per brand'],
    sources: [source('Miloé', 'https://miloe.in/collections/hard-water-essentials/products/hard-water-shampoo', 4.76, 51, false, 'reviews')],
    positives: ['Wash-day option targeted to mineral buildup', 'Compact bottle for shared bathrooms'],
    drawback: 'Clarifying shampoo can feel drying. Follow its label and condition afterward.',
  },
  {
    id: 'cerave-cream', brand: 'CeraVe', name: 'Moisturizing Cream', pack: '340 g', price: 1444,
    pillar: 'skin', slot: 'Moisturize', dorm: true, skin: drySkin, fitKey: 'ceramide-cream', units: 340,
    spec: ['Ceramides NP, AP and EOP', 'Hyaluronic acid and fragrance-free formula'],
    sources: [nykaa('cerave-moisturizing-cream-for-dry-to-very-dry-skin-with-ceramides-hyaluronic-acid/reviews/14509764', 4.5, 11136)],
    positives: ['Rich texture for dry patches', 'Reviewers describe lasting moisture'], fromReviews: true,
    drawback: 'The dense texture may feel heavier than a gel on oily areas.',
  },
  {
    id: 'bioderma-baume', brand: 'Bioderma', name: 'Atoderm Intensive Baume', pack: '200 ml', price: 1664,
    pillar: 'skin', slot: 'Moisturize', dorm: true, skin: ['Dry', 'Sensitive'], fitKey: 'ceramide-cream', units: 200,
    spec: ['Ceramides and canola oil', 'Rich balm for very dry skin'],
    sources: [nykaa('bioderma-atoderm-intensive-baume/reviews/68494', 4.5, 11840)],
    positives: ['Comfort on very dry patches', 'Buyers like the rich skin feel'], fromReviews: true,
    drawback: 'A thick balm can feel heavy in humid weather.',
  },
  {
    id: 'forest-elixir', brand: 'Forest Essentials', name: 'Sanjeevani Beauty Elixir', pack: '30 g', price: 4995,
    pillar: 'skin', slot: 'Moisturize', dorm: true, natural: true, skin: ['Dry', 'Normal', 'Combination'], concerns: ['Fine lines', 'Dullness & uneven texture'], units: 30,
    spec: ['Botanical moisturizer', 'Brand lists aloe and kokum butter'],
    sources: [nykaa('forest-essentials-advanced-sanjeevani-beauty-elixir/p/1010797', 4.4, 843)],
    positives: ['Botanical leave-on moisturizer', 'Small jar for portability'],
    drawback: 'This is a luxury botanical formula. Review the fragrance ingredients if you are sensitive.',
  },
  {
    id: 'caudalie-vinoperfect', brand: 'Caudalie', name: 'Vinoperfect Brightening Dark Spot Serum', pack: '30 ml', price: 6925,
    pillar: 'skin', slot: 'Treat', dorm: true, adult: true, skin: ['Dry', 'Normal', 'Oily', 'Combination'], concerns: ['Dark spots / hyperpigmentation', 'Dullness & uneven texture'], units: 30,
    spec: ['Viniferine, a grapevine-derived ingredient', 'Leave-on brightening serum'],
    sources: [nykaa('caudalie-vinoperfect-brightening-dark-spot-serum/p/15149092', 4.4, 809)],
    positives: ['Reviewers mention light, fast-absorbing texture', 'Some reviewers report repurchasing it'], fromReviews: true,
    drawback: 'Price per milliliter is high, and appearance changes vary.',
  },
  {
    id: 'domyos-grip', brand: 'Domyos', name: 'Light Resistance 11 kg Handgrip', pack: '1 handgrip', price: 99,
    pillar: 'fitness', slot: 'Workout', dorm: true, goals: [...activeGoals], fitKey: 'handgrip', units: 1,
    spec: ['11 kg fixed resistance', 'Manual spring handgrip'],
    sources: [decathlon('p/8576806/hand-grip/11-kg-light-resistance-weight-training-handgrip-yellow', 4.8, 1300)],
    positives: ['Small enough to store in a drawer', 'Simple, silent grip training'],
    drawback: 'Fixed resistance limits progression.',
  },
  {
    id: 'decathlon-ball', brand: 'Decathlon', name: 'Small Massage Ball', pack: '1 ball · purple', price: 199,
    pillar: 'fitness', slot: 'Workout', dorm: true, fitKey: 'manual-massage', units: 1,
    spec: ['Manual massage ball', 'No batteries or mounting'],
    sources: [decathlon('p/8604434/small-massage-ball-purple', 4.8, 3100)],
    positives: ['Fits in a pocket', 'Allows targeted pressure during mobility breaks'],
    drawback: 'Its small contact area can feel intense. Start with light pressure.',
  },
  {
    id: 'domyos-grips', brand: 'Domyos', name: 'Push-Up Bar Grips', pack: '1 pair', price: 499,
    pillar: 'fitness', slot: 'Workout', dorm: true, goals: [...activeGoals], units: 2,
    spec: ['Stackable pair', 'Rubber grip pads'],
    sources: [decathlon('reviews/8945391/push-up-bar-grips', 4.8, 300)],
    positives: ['Buyers describe a secure handgrip', 'Several reviews praise the sturdy build'], fromReviews: true,
    drawback: 'One buyer recommends a mat to reduce skidding on slick floors.', criticalReview: true,
  },
  {
    id: 'corength-band', brand: 'Corength', name: '15 kg Training Resistance Band', pack: '1 band', price: 499,
    pillar: 'fitness', slot: 'Workout', dorm: true, goals: [...activeGoals], fitKey: 'resistance-band', units: 1,
    spec: ['15 kg nominal resistance', 'Single closed-loop training band'],
    sources: [decathlon('p/8484819/weight-training-resistance-band-15kg-for-home-gym-workout-medium-resistance', 4.8, 4900)],
    positives: ['Easy to store in a small room', 'Supports quiet resistance work'],
    drawback: 'One resistance level. Inspect for wear before use.',
  },
  {
    id: 'kimjaly-mat', brand: 'Kimjaly', name: '4 mm Lightweight Yoga Mat', pack: '172 × 58 cm', price: 399,
    pillar: 'fitness', slot: 'Workout', dorm: true, fitKey: 'yoga-mat', units: 1,
    spec: ['4 mm foam', 'Lightweight mat for beginner mobility'],
    sources: [decathlon('p/8965434/yoga-mat-4mm-thick-lightweight-foam-172-x-58-cm-for-beginners-grey', 4.6, 605)],
    positives: ['Light enough to carry', 'Rolls up for storage'],
    drawback: '4 mm provides limited cushioning on hard floors.',
  },
  {
    id: 'domyos-band-kit', brand: 'Domyos', name: 'Training Resistance Band Set', pack: '5 bands', price: 1999,
    pillar: 'fitness', slot: 'Workout', dorm: true, goals: [...activeGoals], fitKey: 'resistance-band', units: 5,
    spec: ['Five resistance bands', 'Compact, quiet strength accessory'],
    sources: [decathlon('reviews/8920546/weight-training-resistance-band-set-of-5', 4.5, 146)],
    positives: ['Multiple tension options', 'Reviewers use it for at-home resistance work'],
    drawback: 'Band tension depends on stretch. Check the recommended setup for each movement.',
  },
  {
    id: 'corength-pullup', brand: 'Corength', name: '100 cm Door-Lockable Pull-Up Bar', pack: '1 bar', price: 2999,
    pillar: 'fitness', slot: 'Workout', dorm: false, adult: true, goals: [...activeGoals], units: 1,
    spec: ['100 cm model', 'Rated up to 100 kg without screws or 120 kg with screws, per maker'],
    sources: [decathlon('p/8588491/weight-training-door-lockable-pull-up-bar-supports-upto-100-120kg-100cm-long', 4.7, 966)],
    positives: ['Strong grip reported by buyers', 'Reviewers like removable mounting'], fromReviews: true,
    drawback: 'It requires a compatible doorway and correct installation. Measure before buying.',
  },
  {
    id: 'domyos-dumbbells', brand: 'Domyos', name: '20 kg Adjustable Cast Iron Dumbbell Set', pack: '20 kg kit', price: 5999,
    pillar: 'fitness', slot: 'Workout', dorm: false, adult: true, goals: [...activeGoals], units: 20,
    spec: ['Cast iron plates and two threaded steel bars', 'Adjusts in 2 kg increments'],
    sources: [decathlon('reviews/8018574/weight-training-20-kg-partly-recycled-cast-iron-dumbbells-set', 4.7, 5214)],
    positives: ['Buyers praise the adjustable weights', 'Several reviewers like the value for home training'], fromReviews: true,
    drawback: 'Heavy cast iron requires safe floor space and controlled set-downs.',
  },
  {
    id: 'domyos-vest', brand: 'Domyos', name: 'Adjustable 6 kg Weighted Vest', pack: 'Vest with four 1 kg plates', price: 4599,
    pillar: 'fitness', slot: 'Workout', dorm: true, adult: true, goals: [...activeGoals], units: 6,
    spec: ['6 kg supplied weight', 'Expandable with separately sold plates'],
    sources: [decathlon('p/8786091/adjustable-weighted-vest-6kg-with-4-plates-of-1kg-each-expandable-upto-14kg', 4.7, 822)],
    positives: ['Adds load without floor-mounted gear', 'Adjustable load and fit'],
    drawback: 'The starting weight can be too much for beginners. Check fit and use only for controlled movements.',
  },
  {
    id: 'quaker-oats', brand: 'Quaker', name: 'Rolled Oats', pack: '1 kg', price: 175,
    pillar: 'diet', slot: 'Breakfast', dorm: true, diet: 'plant', jain: true, allergens: ['Gluten'], fitKey: 'rolled-oats', units: 1000,
    spec: ['Plain rolled oats', 'Use package directions for preparation'],
    sources: [bigbasket('product-reviews/208345/quaker-oats-rich-in-protein-dietary-fibre-nutrition-helps-to-maintain-cholesterol-1-kg-pouch/', 4.2, 16099)],
    positives: ['Single-grain breakfast staple', 'Low pack cost per 100 g'],
    drawback: 'For PG use, follow the pack and use kettle prep or soak only if the label permits it.',
    serving: { size: '40 g · food estimate', macros: { calories: 152, protein: 5.2, carbs: 27.2, fat: 2.8 } },
  },
  {
    id: 'pro-nature-chana', brand: 'Pro Nature', name: 'Organic Roasted Chana Dal', pack: '200 g', price: 69,
    pillar: 'diet', slot: 'Snack', dorm: true, diet: 'plant', jain: true, fitKey: 'roasted-chana', units: 200,
    spec: ['Roasted Bengal gram', 'Ready-to-eat dry snack'],
    sources: [bigbasket('product-reviews/40005009/pro-nature-organic-roasted-channa-dal-200-g-pouch/', 4, 886)],
    positives: ['Plain pantry snack', 'No stove or refrigeration required'],
    drawback: 'Dry texture. Check the package for cross-contact.',
    serving: { size: '30 g · food estimate', macros: { calories: 111, protein: 6.3, carbs: 17.7, fat: 1.8 } },
  },
  {
    id: 'pintola-organic', brand: 'Pintola', name: 'Organic Unsweetened Crunchy Peanut Butter', pack: '350 g', price: 185,
    pillar: 'diet', slot: 'Breakfast', dorm: true, diet: 'plant', allergens: ['Nuts'], fitKey: 'peanut-butter', units: 350,
    spec: ['Unsweetened crunchy peanut spread', 'Peanut is a declared ingredient'],
    sources: [bigbasket('product-reviews/40127459/pintola-organic-peanut-butter-crunchy-unsweetened-100-natural-350-g/?page=2', 4.2, 365)],
    positives: ['Easy to add to cold breakfast bowls', 'Unsweetened crunchy texture'],
    drawback: 'Contains peanuts. Check the active listing for local stock.',
    serving: { size: '16 g · food estimate', macros: { calories: 94, protein: 4.8, carbs: 3.2, fat: 8 } },
  },
  {
    id: 'fastup-reload', brand: 'Fast&Up', name: 'Reload Lime & Lemon Electrolytes', pack: '20 tablets', price: 239,
    pillar: 'diet', slot: 'Hydration', dorm: true, diet: 'unclear', adult: true, goals: ['maintenance', 'loss', 'gain', 'recomp'], units: 20,
    spec: ['Effervescent electrolyte tablets', 'See the current pack for sodium and serving directions'],
    sources: [source('Tata 1mg', 'https://www.1mg.com/otc/fast-up-reload-instant-electrolytes-vitamins-for-hydration-energy-effervescent-tablet-20-each-flavour-lime-lemon-otc506244?iv=1&qv=1', 4.2, 69)],
    positives: ['Portable tube', 'Dissolves in water with no kitchen needed'],
    drawback: 'Contains added sodium, and one reviewer found it sweet. Check the amount of sugar and sodium on the label.', criticalReview: true,
  },
  {
    id: 'mb-creamp', brand: 'MuscleBlaze', name: 'CreAMP Creatine Monohydrate', pack: '100 g · unflavoured', price: 549,
    pillar: 'diet', slot: 'Snack', dorm: true, diet: 'unclear', adult: true, goals: ['gain'], units: 100,
    spec: ['Micronised creatine monohydrate with CreAbsorb', 'Creatine provides no protein serving'],
    sources: [healthkart('muscleblaze-creatine-monohydrate/SP-8688?navKey=VRNT-51779', 4.5, 4665)],
    positives: ['Unflavoured format', 'Small starter pack'],
    drawback: 'Ingredient and suitability checks matter for a supplement. Read the current package before use.',
  },
  {
    id: 'nutrabay-pea-500', brand: 'Nutrabay', name: 'Gold Pea Protein', pack: '500 g · Rich Chocolate Creme', price: 798,
    pillar: 'diet', slot: 'Snack', dorm: true, diet: 'plant', adult: true, goals: [...activeGoals], fitKey: 'pea-gold-chocolate', units: 500,
    spec: ['25 g protein per 40 g scoop', 'Hydrolyzed pea protein and soluble fiber'], sources: peaSources, ...peaNotes,
  },
  {
    id: 'nutrabay-pea-1kg', brand: 'Nutrabay', name: 'Gold Pea Protein', pack: '1 kg · Rich Chocolate Creme', price: 1499,
    pillar: 'diet', slot: 'Snack', dorm: true, diet: 'plant', adult: true, goals: [...activeGoals], fitKey: 'pea-gold-chocolate', units: 1000,
    spec: ['25 g protein per 40 g scoop', 'Hydrolyzed pea protein and soluble fiber'], sources: peaSources, ...peaNotes,
  },
  {
    id: 'nutrabay-pea-4kg', brand: 'Nutrabay', name: 'Gold Pea Protein', pack: '4 kg · Rich Chocolate Creme', price: 5499,
    pillar: 'diet', slot: 'Snack', dorm: true, diet: 'plant', adult: true, goals: [...activeGoals], fitKey: 'pea-gold-chocolate', units: 4000,
    spec: ['25 g protein per 40 g scoop', 'Hydrolyzed pea protein; 100 servings per listed pack'], sources: peaSources, ...peaNotes,
    drawback: 'The bulk pack takes shelf space. Compare the 500 g pack if you are trying the flavor for the first time.',
  },
  {
    id: 'mb-whey-500', brand: 'MuscleBlaze', name: 'Biozyme Performance Whey', pack: '500 g · Rich Chocolate', price: 2199,
    pillar: 'diet', slot: 'Snack', dorm: true, diet: 'dairy', allergens: ['Dairy / lactose'], adult: true, goals: [...activeGoals], fitKey: 'biozyme-rich-chocolate', units: 500,
    spec: ['25 g protein per labeled serving', 'Whey protein contains milk'], sources: [wheySource], labelProtein: 25, ...wheyNotes,
  },
  {
    id: 'mb-whey-1kg', brand: 'MuscleBlaze', name: 'Biozyme Performance Whey', pack: '1 kg · Rich Chocolate', price: 4199,
    pillar: 'diet', slot: 'Snack', dorm: true, diet: 'dairy', allergens: ['Dairy / lactose'], adult: true, goals: [...activeGoals], fitKey: 'biozyme-rich-chocolate', units: 1000,
    spec: ['25 g protein per labeled serving', 'Whey protein contains milk'], sources: [wheySource], labelProtein: 25, ...wheyNotes,
  },
  {
    id: 'on-whey', brand: 'Optimum Nutrition', name: 'Gold Standard 100% Whey', pack: '5 lb · Vanilla Ice Cream', price: 11329,
    pillar: 'diet', slot: 'Snack', dorm: true, diet: 'dairy', allergens: ['Dairy / lactose', 'Soy'], adult: true, goals: [...activeGoals], units: 2268,
    labelProtein: 24, fitKey: 'gold-standard-vanilla',
    spec: ['24 g protein per labeled serving', 'Whey blend with isolate and concentrate', 'Contains milk. Check the current label for soy.'],
    sources: [healthkart('on-optimum-nutrition-gold-standard-100-whey-protein/SP-9558?navKey=VRNT-14670', 4.4, 3700)],
    positives: ['High labeled protein per scoop', 'Multiple serving format for regular use'],
    drawback: 'Large tub takes storage space and contains milk proteins.',
  },
  ...catalogAdditions,
];

export const productTierLabels: Record<Budget, string> = {
  zero: 'DIY / Natural Essentials', student: 'Student / Value Picks', mid: 'Mid-Range Performance', luxury: 'Premium / Clinical Luxury',
};
export function productTier(price: number): Budget {
  return price < 300 ? 'zero' : price < 1000 ? 'student' : price < 3500 ? 'mid' : 'luxury';
}

export function aggregateReviews(product: Product) {
  const count = product.sources.reduce((total, review) => total + review.count, 0);
  const verified = product.sources.reduce((total, review) => total + (review.verified ? review.count : 0), 0);
  const stars = product.sources.reduce((total, review) => total + review.stars * review.count, 0) / count;
  return { count, verified, stars };
}

export function matchProduct(product: Product, profile: UserBioProfile, ignoreTier = false) {
  if (!ignoreTier && productTier(product.price) !== profile.budget) return null;
  if (product.clinicianReview) return null;
  if ((profile.environment === 'pg' || profile.environment === 'office') && !product.dorm) return null;
  if (product.adult && profile.age < 20) return null;
  const safety = safetyFor(profile);
  if (safety.gentleSkin && (product.slot === 'Treat' || product.slot === 'Haircare' || (product.pillar === 'skin' && product.natural))) return null;
  if (safety.lowImpact && product.pillar === 'fitness' && product.goals?.length) return null;
  if (safety.steadyEnergy && product.pillar === 'diet' && product.adult) return null;
  const reasons: string[] = [];
  let score = 78 + (product.dorm && profile.environment === 'pg' ? 6 : 3);
  if (product.pillar === 'skin') {
    if (product.slot === 'Haircare') {
      if (!profile.exposures.includes('Hard water') || profile.approach === 'natural') return null;
      reasons.push('Chelating wash-day formula for your hard-water exposure');
      score += 14;
    } else {
      if (!(product.skin ?? skinTypes).includes(profile.skin)) return null;
      if (profile.approach === 'natural' && !product.natural && product.slot !== 'Protect') return null;
      if (profile.approach === 'clinical' && product.natural) return null;
      const concernFit = product.concerns?.filter(concern => profile.concerns.includes(concern)).length ?? 0;
      if (product.slot === 'Treat' && !concernFit) return null;
      if (concernFit > 0) { score += 10 + Math.min(4, concernFit * 2); reasons.push('Matches a selected skin concern'); }
      if (product.slot === 'Protect' && profile.exposures.includes('High outdoor sun / UV')) { score += 8; reasons.push('Fits your high outdoor sun exposure'); }
      score += 4;
      reasons.push(`Cataloged for ${profile.skin.toLowerCase()} skin`);
    }
  }
  if (product.pillar === 'diet') {
    if (profile.exclusions.some(exclusion => product.allergens?.includes(exclusion))) return null;
    if (profile.exclusions.length && product.adult && product.diet === 'unclear') return null;
    if (profile.diet === 'Vegan' && product.diet !== 'plant') return null;
    if (profile.diet === 'Jain / Satvik' && !product.jain) return null;
    if (profile.diet !== 'Omnivore' && product.diet === 'unclear') return null;
    if (product.goals && !product.goals.includes(profile.goal)) return null;
    score += product.goals ? 12 : 5;
    reasons.push(product.goals ? 'Selected for your movement goal' : 'Matches your diet and listed exclusions');
  }
  if (product.pillar === 'fitness') {
    const kind = productKind(product);
    if (profile.age >= 60 && (kind === 'strength' || product.id === 'decathlon-hard-roller')) return null;
    if (safety.pregnancy && kind === 'scales') return null;
    if (product.goals && !product.goals.includes(profile.goal) && product.adult) return null;
    if (product.id === 'domyos-vest' && (profile.activity === 'sedentary' || profile.activity === 'light')) return null;
    if (product.id === 'corength-pullup' && profile.weightKg > 100) return null;
    score += product.goals?.includes(profile.goal) ? 12 : 5;
    reasons.push(product.goals?.includes(profile.goal) ? 'Supports your strength goal' : 'Supports your regular movement routine');
    if (profile.age >= 60 && kind === 'pedals') {
      reasons.push('Can be used for seated movement with a stable chair');
      score += 6;
    }
  }
  reasons.push(profile.environment === 'pg' ? 'Compatible with the catalog’s PG setup' : 'Fits the selected environment');
  if (productTier(product.price) === profile.budget) reasons.push('Within the selected per-item tier');
  return { score: Math.min(100, score), reasons };
}

export function budgetAlternative(product: Product, profile: UserBioProfile) {
  if (!product.fitKey) return undefined;
  const stars = aggregateReviews(product).stars;
  return products.filter(item => item.fitKey === product.fitKey && item.price < product.price &&
    aggregateReviews(item).stars >= stars && matchProduct(item, profile, true))
    .sort((a, b) => a.price - b.price)[0];
}

export function productValue(product: Product) {
  return aggregateReviews(product).stars / product.price * (product.units ?? 1);
}

export function productDiscovery(profile: UserBioProfile): DiscoveryItem[] {
  return products.flatMap(product => matchProduct(product, profile) ? [{
    id: product.id, pillar: product.pillar, target: product.id, page: 'gear' as const,
    title: `${product.brand} ${product.name}`, description: product.spec.join(' · '),
    amount: product.price, minutes: 0, tags: product.pillar === 'skin' ? ['Acne / Glow'] : product.goals?.includes('gain') ? ['Muscle Gain'] : ['Sustained Energy'],
  }] : []);
}

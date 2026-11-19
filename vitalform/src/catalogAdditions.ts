import { type Product, type ReviewSource } from './products';

function listing(retailer: string, url: string, stars: number, count: number, verified = false, unit: ReviewSource['unit'] = 'ratings'): ReviewSource[] {
  return [{ retailer, url, stars, count, verified, unit }];
}

const nykaa = (path: string, stars: number, count: number) => listing('Nykaa', `https://www.nykaa.com/${path}`, stars, count, true);
const decathlon = (path: string, stars: number, count: number) => listing('Decathlon', `https://www.decathlon.in/p/${path}`, stars, count, false, 'reviews');

export const catalogAdditions: Product[] = [
  {
    id: 'jeva-multani', brand: 'Jeva', name: 'Multani Mitti Powder Face Pack', pack: '100 g', price: 70,
    pillar: 'skin', kind: 'natural', slot: 'Treat', dorm: true, natural: true, skin: ['Oily', 'Combination'], concerns: ['Acne & breakouts'], units: 100,
    spec: ['Multani mitti clay powder', 'Mixable rinse-off face pack'],
    sources: nykaa('jeva-multani-mitti-powder-face-pack/reviews/24729356', 4.2, 745),
    positives: ['Simple powder format', 'A low-cost wash-off option'], drawback: 'Clay can feel drying or tight. Patch test first and follow the rinse time on the pack.',
  },
  {
    id: 'dabur-rose', brand: 'Dabur', name: 'Gulabari Premium Rose Water', pack: '120 ml', price: 54,
    pillar: 'skin', kind: 'natural', slot: 'Hydrate', dorm: true, natural: true, skin: ['Dry', 'Normal', 'Combination'], units: 120,
    spec: ['Rose-scented water', 'Leave-on facial mist or toner'],
    sources: nykaa('dabur-gulabari-premium-rose-water/p/27459', 4.5, 85133),
    positives: ['Easy-to-store bottle', 'Affordable optional toner step'], drawback: 'Check the full ingredient list if you react to fragrance. The listing can be out of stock.',
  },
  {
    id: 'kama-rose', brand: 'Kama Ayurveda', name: 'Pure Rose Water', pack: '200 ml', price: 1301,
    pillar: 'skin', kind: 'natural', slot: 'Hydrate', dorm: true, natural: true, skin: ['Dry', 'Normal', 'Combination'], units: 200,
    spec: ['Steam-distilled rose water', 'Facial mist'],
    sources: nykaa('kama-ayurveda-pure-rose-water/p/28273', 4.5, 89976),
    positives: ['Spray format for an optional mist step', 'Single botanical water'], drawback: 'Botanical fragrance can cause reactions in some users. A mist does not replace moisturizer.',
  },
  {
    id: 'joseon-relief', brand: 'Beauty of Joseon', name: 'Relief Sun Rice + Probiotics', pack: '50 ml', price: 1570,
    pillar: 'skin', kind: 'sunscreen', slot: 'Protect', dorm: true, skin: ['Dry', 'Normal', 'Combination'], units: 50,
    spec: ['SPF 50+ PA++++', 'Rice extract and fermented ingredients', 'Cream-textured sunscreen'],
    sources: nykaa('beauty-of-joseon-relief-sunscreen-rice-probiotics-spf-50-pa/p/16900408', 4.4, 22799),
    positives: ['Handy small tube', 'Broad-spectrum daily protection'], drawback: 'Choose a sunscreen labeled water resistant for swimming or heavy sweating.',
  },
  {
    id: 'minimalist-spf-lip', brand: 'Minimalist', name: 'SPF 30 Lip Balm', pack: '8 g', price: 299,
    pillar: 'skin', kind: 'lipBalm', slot: 'LipCare', dorm: true, units: 8,
    spec: ['SPF 30 lip balm', 'Clear balm in a squeeze tube'],
    sources: nykaa('minimalist-spf-30-lip-balm/reviews/7898705', 4.3, 8982),
    storeLinks: [{ name: 'Minimalist official store', url: 'https://beminimalist.co/products/lip-balm-spf-30' }],
    positives: ['Buyers describe long-lasting moisture', 'Several report a low-shine finish'], fromReviews: true, criticalReview: true,
    drawback: 'Some reviewers say the balm feels heavy or sticky.',
  },
  {
    id: 'vaseline-original-lips', brand: 'Vaseline', name: 'Lip Care Balm Stick Original Lips', pack: '4.8 g', price: 172,
    pillar: 'skin', kind: 'lipBalm', slot: 'LipCare', dorm: true, units: 4.8,
    spec: ['Petrolatum-based balm with cocoa and shea butter', 'Clear lip balm stick'],
    sources: nykaa('vaseline-lip-care-lip-balm-stick/reviews/23603284', 4.4, 1995),
    positives: ['Reviewers describe a moisturizing feel', 'Buyers like its low price'], fromReviews: true,
    drawback: 'For outdoor UV protection, use a lip balm with SPF on the label.',
  },
  {
    id: 'loreal-metal-dx', brand: 'L’Oréal Professionnel', name: 'Metal DX Cleansing Cream Shampoo', pack: '300 ml', price: 1390,
    pillar: 'skin', kind: 'shampoo', slot: 'Haircare', dorm: true, units: 300,
    spec: ['Sulfate-free wash-off shampoo', 'Formulated for metal residue in hair'],
    sources: nykaa('l-oreal-professionnel-metal-dx-anti-metal-cleansing-cream-shampoo-serie-expert/reviews/5342883', 4.4, 2447),
    positives: ['Wash-day format for buildup', 'Focuses on metallic residue'], drawback: 'A shampoo does not soften your water supply. Check the current label and avoid if it irritates your scalp.',
  },
  {
    id: 'kimjaly-grip-mat', brand: 'Kimjaly', name: '6 mm Grippy Gentle Yoga Mat', pack: '183 × 61 cm · green', price: 999,
    pillar: 'fitness', kind: 'mats', slot: 'Workout', dorm: true,
    spec: ['6 mm cushioned foam', 'Grippy floor surface', 'Carry strap included'],
    sources: decathlon('8769263/yoga-mat-6mm-thick-183-x-61-cm-better-grip-with-carry-strap-green', 4.7, 311),
    positives: ['Textured surface for gentle yoga', 'Rolls for easy storage'], drawback: 'Check that the mat lies flat and grips the floor before loading it.',
  },
  {
    id: 'decathlon-soft-roller', brand: 'Decathlon', name: 'MR500 Soft Massaging Foam Roller', pack: '1 roller · blue', price: 1999,
    pillar: 'fitness', kind: 'rollers', slot: 'Workout', dorm: true,
    spec: ['Soft textured foam surface', 'Ground-use self-massage roller'],
    sources: decathlon('8858864/massagers-and-sports-recovery/soft-massaging-foam-roller-blue', 4.7, 778),
    positives: ['Softer surface for lighter pressure', 'Works without power or noise'], drawback: 'Skip pressure on joints, injured areas and areas with reduced sensation.',
  },
  {
    id: 'decathlon-hard-roller', brand: 'Decathlon', name: '500 Hard Massage Foam Roller', pack: '1 roller · purple', price: 1599,
    pillar: 'fitness', kind: 'rollers', slot: 'Workout', dorm: true, adult: true, goals: ['gain', 'recomp'],
    spec: ['Firm ridged foam', 'Floor roller for large muscle areas'],
    sources: decathlon('8585283/500-hard-massage-roller-foam-roller-purple', 4.8, 239),
    positives: ['Some buyers praise durability', 'Buyers highlight the firm textured pressure'], fromReviews: true,
    drawback: 'Hard ridges can feel intense. Reduce pressure or choose a softer tool if uncomfortable.',
  },
  {
    id: 'sparnod-smb100', brand: 'Sparnod Fitness', name: 'SMB-100 Mini Pedal Exerciser', pack: '1 unit · grey', price: 1599,
    pillar: 'fitness', kind: 'pedals', slot: 'Workout', dorm: true,
    spec: ['Compact folding pedal base', 'Adjustable resistance and digital counter', 'Designed for seated use'],
    sources: listing('Flipkart', 'https://1.www.flipkart.com/sparnod-fitness-smb-100-pedal-suitable-light-exercise-legs-arms-physiotherapy-home-mini-exerciser-cycle/p/itmeeabb55331db3', 4.4, 94, true),
    storeLinks: [{ name: 'Sparnod official store', url: 'https://sparnodfitness.com/smb-100-mini-cycle-pedal-exerciser' }],
    positives: ['Reviewers highlight its display', 'Some buyers praise build quality'], fromReviews: true, criticalReview: true,
    drawback: 'A buyer reported trouble tightening the resistance knob. Confirm that the base stays put before using it.',
  },
  {
    id: 'healthsense-bs171', brand: 'HealthSense', name: 'BS171 Fitdays Smart Bluetooth Scale', pack: '1 scale', price: 3000,
    pillar: 'fitness', kind: 'scales', slot: 'Workout', dorm: true, adult: true,
    spec: ['Bluetooth Fitdays pairing', 'Digital weight readout', 'App-based body-composition estimates'],
    sources: nykaa('healthsense-bs171-fitdays-smart-bluetooth-scale/p/1080688', 4.2, 9),
    storeLinks: [{ name: 'HealthSense official store', url: 'https://healthsense.in/products/healthsense-fitdays-bs-171-smart-bluetooth-body-weighing-scale-digital-fitness-weight-machine-with-mobile-app-bmi-and-fat-analysis-with-13-compositions-batteries-and-one-year-warranty-included' }],
    positives: ['Readable digital scale', 'Optional app for tracking trends'], drawback: 'A small review sample. Check the manual before enabling bioimpedance measurements.',
  },
  {
    id: 'true-chia', brand: 'True Elements', name: 'Raw Chia Seeds', pack: '150 g', price: 151.24,
    pillar: 'diet', kind: 'seeds', slot: 'Breakfast', dorm: true, diet: 'plant', jain: true, units: 150,
    spec: ['Whole chia seeds', '25 g listed serving', 'Hydrate before eating'],
    sources: listing('BigBasket', 'https://www.bigbasket.com/pd/40042051/true-elements-raw-chia-seeds-premium-raw-chia-seeds-for-eating-150-g-matt-pouch/', 4.2, 705),
    positives: ['Easy to add to soaked oats or yogurt', 'No-cook whole-food option'], drawback: 'Soak the seeds until they gel or stir them into a moist dish. Avoid swallowing dry spoonfuls.',
  },
  {
    id: 'true-flax', brand: 'True Elements', name: 'Raw Flax Seeds', pack: '250 g', price: 149,
    pillar: 'diet', kind: 'seeds', slot: 'Breakfast', dorm: true, diet: 'plant', jain: true, units: 250,
    spec: ['Whole flax seeds', 'Plant source of fibre and ALA'],
    sources: listing('Nykaa', 'https://www.nykaa.com/true-elements-flax-raw-seeds/p/370887', 4.4, 553),
    storeLinks: [{ name: 'BigBasket', url: 'https://www.bigbasket.com/pd/40167067/true-elements-raw-flax-seeds-250-g-matt-pouch/' }],
    positives: ['Stir into meals without cooking', 'Resealable storage pack'], drawback: 'Check allergen declarations and follow the pack’s storage directions.',
  },
  {
    id: 'supradyn-daily', brand: 'Supradyn', name: 'Daily Multivitamin', pack: '15 tablets', price: 75,
    pillar: 'diet', kind: 'vitamins', slot: 'Snack', dorm: true, adult: true, clinicianReview: true, diet: 'unclear', units: 15,
    spec: ['Multiple vitamins and minerals', 'Check the exact strip for amounts per tablet and excipients'],
    sources: listing('Tata 1mg', 'https://www.1mg.com/otc/supradyn-daily-multivitamin-for-men-and-women-daily-immunity-and-2x-energy-tablet-otc657862', 4.5, 6016),
    storeLinks: [{ name: 'PharmEasy', url: 'https://pharmeasy.in/health-care/products/supradyn-daily-multivitamin-tablets-15s-3514609' }],
    positives: ['Compact strip', 'Lists multiple nutrient amounts on one label'], drawback: 'Check for overlap with other supplements and discuss use with your pharmacist.',
  },
  {
    id: 'seven-seas-original', brand: 'Seven Seas', name: 'Original Cod Liver Oil', pack: '100 capsules', price: 408,
    pillar: 'diet', kind: 'omega', slot: 'Snack', dorm: true, adult: true, clinicianReview: true, diet: 'unclear', allergens: ['Seafood'], units: 100,
    spec: ['Cod liver oil contains fish', 'Look for EPA, DHA and vitamins A and D on the pack'],
    sources: listing('Tata 1mg', 'https://www.1mg.com/otc/seven-seas-original-cod-liver-oil-capsule-for-immunity-brain-bone-health-pure-omega-3-otc148937', 4.5, 4837),
    storeLinks: [{ name: 'PharmEasy', url: 'https://pharmeasy.in/health-care/products/sevenseas-original-cap-19301' }],
    positives: ['Capsule format', 'Lists oil and vitamin content on the label'], drawback: 'Check vitamin A and D overlap and possible interactions with your pharmacist.',
  },
  {
    id: 'ensure-vanilla', brand: 'Ensure', name: 'Complete Balanced Nutrition Powder', pack: '950 g · vanilla', price: 1660,
    pillar: 'diet', kind: 'seniorNutrition', slot: 'Snack', dorm: true, adult: true, clinicianReview: true, diet: 'dairy', allergens: ['Dairy / lactose', 'Soy'], units: 950,
    spec: ['Adult nutrition drink powder', 'Fortified with calcium and vitamin D', 'Check carbohydrate, allergens and mixing instructions'],
    sources: listing('Tata 1mg', 'https://www.1mg.com/otc/ensure-powder-complete-balanced-drink-for-adults-for-strength-immunity-energy-with-essential-vitamins-nutrition-formula-vanilla-otc999798', 4.5, 4021),
    storeLinks: [
      { name: 'PharmEasy', url: 'https://pharmeasy.in/health-care/products/ensure-balanced-nutrition-drink-powder-for-adults---950-g-vanilla-flavored-4220630' },
      { name: 'Abbott product information', url: 'https://www.family.abbott/in-en/ensure/products/ensure-vanilla.html' },
    ],
    positives: ['Mixes with water', 'Label lists macro- and micronutrients'], drawback: 'Contains milk and soy. Ask the care team about nutrition and swallowing needs before purchase.',
  },
];

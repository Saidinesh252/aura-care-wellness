import { type Pillar } from './context';
import { productKind, type CatalogKind } from './catalogKinds';
import { type Product } from './products';

type Checklist = { title: string; points: readonly string[] };
type Directions = { quantity: string; timing: string; precautions: string; source?: { title: string; url: string } };

const patchTest = {
  title: 'AAD guide to testing skin care products',
  url: 'https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products',
};
const sunscreenSource = {
  title: 'AAD sunscreen instructions',
  url: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen',
};
const multivitaminSource = { title: 'NIH guide to multivitamins', url: 'https://ods.od.nih.gov/factsheets/MVMS-Consumer/' };
const omegaSource = { title: 'NIH guide to omega-3s', url: 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-Consumer/' };
const calciumSource = { title: 'NIH guide to calcium', url: 'https://ods.od.nih.gov/factsheets/calcium-consumer/' };

export const categoryGuides: Record<Pillar | 'all', Checklist> = {
  all: { title: 'Compare any wellness product', points: ['Choose the routine step you want to fill.', 'Compare the same pack size, listing and variant across stores.', 'Check current directions, returns and seller details before buying.'] },
  skin: { title: 'Build a simple skin routine', points: ['Start with a cleanser, a moisturizer and sun protection.', 'Check fragrance, texture and your active-ingredient schedule.', 'Pick sunscreen you can apply generously and reapply outdoors.'] },
  fitness: { title: 'Choose gear you can use comfortably', points: ['Check size, support and storage against your space.', 'Look for a stable setup and manageable resistance.', 'Read the equipment limits, care instructions and warranty.'] },
  diet: { title: 'Read the serving label first', points: ['Check ingredients and allergen or cross-contact statements.', 'Compare portion size, protein, added sugar and sodium.', 'Ask a clinician or pharmacist whether supplements fit your care and medicines.'] },
};

const kinds: Record<CatalogKind, Checklist> = {
  cleanser: { title: 'Gentle cleanser checklist', points: ['Choose a rinse-off or no-rinse format you will use as directed.', 'Look for a fragrance-free option if your skin reacts easily.', 'Look for a comfortable finish without tightness or stinging.'] },
  serum: { title: 'Treatment serum checklist', points: ['Match one active and its concentration to the goal.', 'Check that it works with the actives already in your schedule.', 'Check patch-test guidance and any health flags before purchase.'] },
  moisturizer: { title: 'Moisturizer checklist', points: ['Try a lighter gel or lotion for a lighter feel and a cream or balm for extra richness.', 'Look for a fragrance-free option for easily irritated skin.', 'Compare tube and jar sizes and the ingredient list.'] },
  sunscreen: { title: 'Sunscreen checklist', points: ['Look for broad-spectrum coverage and SPF 30 or higher. PA++++ indicates a high UVA protection grade where listed.', 'Try a fluid or gel for a lighter finish and a cream for dry skin. Check the label if you prefer a non-comedogenic product.', 'Choose a water-resistant label for swimming or heavy sweating.'] },
  lipBalm: { title: 'Lip balm checklist', points: ['Choose a plain balm if fragrances or flavors sting.', 'Look for SPF 30 or higher when picking a balm for outdoors.', 'Check for any personal sensitivities before changing products.'] },
  shampoo: { title: 'Hard-water shampoo checklist', points: ['Check whether the label names a chelating or mineral-removal ingredient.', 'Check suitability for a sensitive scalp or color-treated hair.', 'Look for clear frequency directions and plan a conditioner if hair feels dry.'] },
  natural: { title: 'Botanical and DIY checklist', points: ['Read the full ingredient list, including added fragrance or preservatives.', 'Check whether the product is meant to be rinsed off or left on.', 'Try one new product at a time and check tolerance before regular use.'] },
  bands: { title: 'Resistance band checklist', points: ['Choose a tension that allows controlled motion.', 'Check band length, material and anchor instructions.', 'Look for damaged seams or cracks before use.'] },
  mats: { title: 'Mat checklist', points: ['Compare length, grip and cushioning against your floor and exercises.', 'Check that edges lie flat and that the mat stays put.', 'If you use a chair or aid for balance, keep the standing area clear.'] },
  strength: { title: 'Strength equipment checklist', points: ['Check load range, dimensions and any assembly limits.', 'Start with resistance you can move with control.', 'Check that mounts, collars or plates lock as specified.'] },
  grips: { title: 'Grip and support checklist', points: ['Choose a grip that fits your hand and allows a comfortable wrist position.', 'Check rubber pads or resistance level before use.', 'Confirm the product remains stable on your floor.'] },
  rollers: { title: 'Roller and massage tool checklist', points: ['Choose a softer surface if firmer pressure feels uncomfortable.', 'Check whether you can use the tool without a difficult floor transfer.', 'Avoid tools or positions that press directly on painful joints.'] },
  pedals: { title: 'Seated pedal exerciser checklist', points: ['Choose a low base with non-slip feet and adjustable resistance.', 'Check knee clearance and make sure your chair stays still.', 'Check that you can position or remove the foot straps comfortably.'] },
  scales: { title: 'Smart scale checklist', points: ['Pick a stable surface, a readable display and a weight range that fits.', 'Check the manual’s health restrictions for body-composition measurements.', 'Review app permissions and account requirements before pairing.'] },
  whey: { title: 'Whey protein checklist', points: ['Compare grams of protein per labeled serving rather than scoop size alone.', 'Whey is milk-derived. Check measured lactose and allergen statements even for isolates.', 'Confirm your dietary needs, flavor and seller before choosing a tub.'] },
  plant: { title: 'Plant protein checklist', points: ['Check the source, such as pea or a pea-and-rice blend, and look for a vegan label if needed.', 'Compare protein per serving and added sweeteners.', 'Check for allergens or shared equipment listed on the pack.'] },
  oats: { title: 'Breakfast oats checklist', points: ['Choose plain oats to control added sugar.', 'If you need to avoid gluten, look for a certified gluten-free pack.', 'Check whether it requires stovetop cooking or permits a cold soak.'] },
  spreads: { title: 'Nut butter checklist', points: ['Read the nut and allergen declarations.', 'Compare added sugars and salt per serving.', 'Choose a texture you can eat comfortably.'] },
  seeds: { title: 'Chia and flax checklist', points: ['Look for plain seeds and check any cross-contact warning.', 'Choose chia if you can prepare it in moist foods or ground flax for a softer mix-in.', 'Check the package closure and storage instructions.'] },
  snacks: { title: 'Whole-food snack checklist', points: ['Look for a short ingredient list and compare salt per serving.', 'Choose a texture you can chew comfortably.', 'Check package storage and allergen declarations.'] },
  hydration: { title: 'Electrolyte label checklist', points: ['Compare sodium, sugar and other minerals per prepared serving.', 'Check the label’s water-to-tablet ratio.', 'Check with your care team if you have fluid, salt or potassium restrictions.'] },
  vitamins: { title: 'Multivitamin checklist', points: ['Check whether the formula suits your life stage and the nutrients you need.', 'Compare amounts across everything you already take to avoid duplicating ingredients.', 'Ask a pharmacist about medicine interactions and whether you need it.'] },
  omega: { title: 'Omega-3 checklist', points: ['Look for EPA and DHA amounts per serving and check for fish allergens.', 'Check whether the product also includes vitamins A and D.', 'Ask a pharmacist about suitability if you take blood thinners or are planning surgery.'] },
  seniorNutrition: { title: 'Adult nutrition drink checklist', points: ['Compare protein, calcium, vitamin D, carbohydrate and sodium per prepared serving.', 'Check milk, soy and other allergen statements on the exact flavor.', 'Ask the care team whether the drink suits the person’s needs, prescriptions and swallowing guidance.'] },
  performance: { title: 'Performance supplement checklist', points: ['Choose a product with a clearly labeled amount per serving.', 'Check ingredient lists, optional stimulant blends and cross-contact.', 'Review suitability with a qualified professional.'] },
};

export function selectionChecklist(kind: CatalogKind | 'all', pillar: Pillar | 'all') {
  return kind === 'all' ? categoryGuides[pillar] : kinds[kind];
}

const patchAdvice = 'Test new skincare on a small area for 7–10 days as the AAD describes, following the label for wash-off time. Stop if it stings, swells or causes a rash.';
const supplementPrecaution = 'Confirm suitability and timing with a clinician or pharmacist before adding it. Check the current pack for allergens and avoid duplicating ingredients from other supplements.';

const directionsByKind: Record<CatalogKind, Directions> = {
  cleanser: {
    quantity: 'Use a small amount, or the pump quantity on your pack, to cover your face gently.',
    timing: 'Use before treatments or moisturizer. Rinse with lukewarm water unless the label gives no-rinse directions. Pat dry.',
    precautions: 'Follow your usual cleansing schedule and the label. Avoid scrubbing or applying over irritated skin if it stings. ' + patchAdvice,
    source: patchTest,
  },
  serum: {
    quantity: 'Apply a thin layer using the number of drops on the current pack. Keep it away from the eyes and lips.',
    timing: 'Follow the product’s AM or PM directions, usually after cleansing and before moisturizer. Check your active schedule first.',
    precautions: 'Start at the least frequent use the label allows. Keep exfoliating acids separate from retinoids unless directed by your clinician. ' + patchAdvice,
    source: patchTest,
  },
  moisturizer: {
    quantity: 'Apply an even layer to the dry areas you want to cover.',
    timing: 'Use after cleansing on slightly damp skin. In the morning, follow with sunscreen.',
    precautions: 'Reapply as needed for comfort and follow the label. ' + patchAdvice,
    source: patchTest,
  },
  sunscreen: {
    quantity: 'Cover all exposed skin generously. The AAD suggests about two finger-lengths for the face and roughly 30 ml for all exposed adult body skin.',
    timing: 'Use as the final morning skincare step, about 15 minutes before going outside. Cover the ears and neck too.',
    precautions: 'Reapply at least every two hours outdoors and after swimming or sweating. Check whether this product is water resistant.',
    source: sunscreenSource,
  },
  lipBalm: {
    quantity: 'Glide a thin, even coat over the lips.',
    timing: 'Apply when lips feel dry. For outdoor protection, choose a separate SPF 30 or higher lip balm if this pack has no SPF claim.',
    precautions: 'Reapply for comfort or follow the SPF label. Stop if the formula irritates your lips.',
    source: sunscreenSource,
  },
  shampoo: {
    quantity: 'Use the amount directed on the bottle, enough to lather on wet hair.',
    timing: 'Massage gently, rinse thoroughly and follow with a suitable conditioner.',
    precautions: 'Follow the label’s frequency and contact time. Avoid the eyes and cut back if the scalp or hair feels dry.',
  },
  natural: {
    quantity: 'Use a thin layer or the amount directed on the container.',
    timing: 'Apply as the label directs after cleansing. Rinse products marked wash-off.',
    precautions: patchAdvice, source: patchTest,
  },
  bands: {
    quantity: 'Start with one light band and a few controlled practice repetitions within a comfortable range.',
    timing: 'Use after warming up. Follow the movement cue and the band’s anchoring instructions.',
    precautions: 'Inspect before each session. Increase tension only when you can control both directions. Stop if the band slips or you feel pain.',
  },
  mats: {
    quantity: 'Lay one mat flat on a clean, level floor with room to move.',
    timing: 'Check stability before each floor exercise or stretch.',
    precautions: 'Clean as the manufacturer directs after use. Keep curled edges and straps out of walking paths.',
  },
  strength: {
    quantity: 'Set a manageable resistance within the manufacturer’s limit before the first rep.',
    timing: 'Inspect and secure all moving parts before use. Start after a warm-up with a controlled movement.',
    precautions: 'Leave enough recovery between strength sessions. Follow the assembly and load instructions and stop if stability or form changes.',
  },
  grips: {
    quantity: 'Use one hand trainer at a time, or the complete pair for push-up bars.',
    timing: 'Check your grip and wrist position after warming up. Keep bar grips on a level, non-slipping surface.',
    precautions: 'Practice a few slow repetitions. Stop if your grip slips or if your wrist or hand hurts.',
  },
  rollers: {
    quantity: 'Start with light pressure on one comfortable muscle area.',
    timing: 'Try it during a warm-up or after movement. Use a supported setup you can get into and out of safely.',
    precautions: 'Avoid joints, the spine, bruised areas and sharp pain. Ask your care team before using it on an injury.',
  },
  pedals: {
    quantity: 'Set the device to its lowest tension for a short, comfortable trial.',
    timing: 'Place it on a level, non-slip surface. Sit in a fixed chair, center both feet and start slowly.',
    precautions: 'Check for sliding and clear any straps or obstacles before standing. Stop for pain or dizziness. Ask your care team about pace and progression when appropriate.',
  },
  scales: {
    quantity: 'Take one reading at a time on a dry, hard, level surface.',
    timing: 'If tracking trends, measure at a similar time under consistent conditions.',
    precautions: 'Follow the manual for implanted electronic devices and body-composition mode. If standing is unsteady, choose a supported alternative with your care team.',
  },
  whey: {
    quantity: 'Measure one labeled serving for nutrition comparison. Scoop and liquid sizes depend on the exact flavor and pack.',
    timing: 'If you use it, mix according to the pack and fit it into your daily protein intake.',
    precautions: 'Contains milk. Check lactose, soy and cross-contact labels. Ask a clinician about suitability if you have a medically managed diet.',
  },
  plant: {
    quantity: 'Check the current pack for the scoop’s gram weight and mixing ratio.',
    timing: 'If you use it, shake with the liquid directed on the pack and include it with your planned meals or snacks.',
    precautions: 'Check flavor ingredients and allergen declarations. Ask a clinician about suitability if you have a medically managed diet.',
  },
  oats: {
    quantity: 'Start with the pack’s serving or measure the portion in your meal plan.',
    timing: 'Cook in the directed amount of water or milk. Use a refrigerated cold soak only if the package supports it.',
    precautions: 'Follow storage instructions and check gluten cross-contact when relevant.',
  },
  spreads: {
    quantity: 'Use a measured spoonful as a topping. Check the labeled serving when logging it.',
    timing: 'Spread thinly on food or stir into a breakfast bowl.',
    precautions: 'Avoid if allergic to the nuts listed. Store as directed and choose a suitable texture if swallowing is difficult.',
  },
  seeds: {
    quantity: 'Start with a small amount mixed into food. Use the current label to measure and log a serving.',
    timing: 'Hydrate chia in a moist dish first. Ground flax can be stirred into porridge, curd or another moist food.',
    precautions: 'Avoid swallowing dry chia by the spoonful. Follow care-team guidance if you have swallowing difficulty or a restricted diet.',
  },
  snacks: {
    quantity: 'Use the pack’s serving or the portion listed in your meal plan.',
    timing: 'Pack one portion as a snack or serve alongside a meal.',
    precautions: 'Check texture and allergens. Choose a softer food if chewing or swallowing is difficult.',
  },
  hydration: {
    quantity: 'Use the exact tablet or powder-to-water ratio printed on the current pack.',
    timing: 'Prepare in clean drinking water and allow tablets to dissolve fully.',
    precautions: 'Follow the label’s frequency. Check with your care team before using it if following a fluid, salt or potassium restriction.',
  },
  vitamins: {
    quantity: 'Use only the serving on the exact pack that your care team approves.',
    timing: 'Follow your pharmacist’s guidance on whether to take it with food and how far apart to take medicines.',
    precautions: supplementPrecaution, source: multivitaminSource,
  },
  omega: {
    quantity: 'Read the number of capsules per labeled serving and the listed EPA, DHA, vitamin A and vitamin D amounts.',
    timing: 'Use the label and your pharmacist’s instructions for meal timing.',
    precautions: 'Fish oil can interact with some medicines. Confirm suitability with your pharmacist and avoid the product if allergic to its ingredients.',
    source: omegaSource,
  },
  seniorNutrition: {
    quantity: 'Measure the dry powder and liquid with the exact pack’s mixing instructions. Mention any prescribed portions to the care team.',
    timing: 'Mix just before serving, at a time agreed with the person and their care team.',
    precautions: 'Check allergens, carbohydrate and sodium. Follow any swallowing, fluid or nutrition plan from the care team.',
    source: calciumSource,
  },
  performance: {
    quantity: 'Refer to the current pack for grams per serving and the required amount of water.',
    timing: 'Confirm timing with a qualified professional before adding it to the routine.',
    precautions: supplementPrecaution,
  },
};

const directionsByProduct: Readonly<Partial<Record<string, Partial<Directions>>>> = {
  'minimalist-niacinamide': {
    quantity: 'The brand lists two to three drops for a thin layer.',
    timing: 'Let it absorb after cleansing and any toner, before moisturizer. Follow your routine’s scheduled AM or PM slot.',
    source: { title: 'Minimalist niacinamide directions', url: 'https://beminimalist.co/products/niacinamide-10-with-matmarine' },
  },
  'minimalist-bha': {
    quantity: 'The brand lists two to three drops for a thin layer.',
    timing: 'Use in the evening after cleansing and any toner. Let it absorb before applying moisturizer.',
    precautions: 'Patch test first. Follow the slower schedule if your routine calls for alternate evenings or fewer uses. Keep it separate from retinoids and other exfoliants.',
    source: { title: 'Minimalist salicylic acid directions', url: 'https://beminimalist.co/products/salicylic-acid-2' },
  },
  'minimalist-spf-lip': {
    timing: 'Smooth evenly over the lips 15 minutes before going outside.',
    precautions: 'Reapply about every two hours outdoors, and after eating or wiping it off. Follow the current label.',
    source: { title: 'Minimalist SPF 30 label directions', url: 'https://beminimalist.co/products/lip-balm-spf-30' },
  },
  'jeva-multani': {
    quantity: 'Use a small spoonful and the water amount on the pack to make a thin paste.',
    timing: 'Apply a thin layer to the intended area. Rinse at the label’s stated time.',
    precautions: 'Clay can feel drying. Use the label’s frequency and avoid irritated or broken skin. ' + patchAdvice,
  },
  'dabur-rose': { timing: 'Pat a small amount onto clean skin, then follow with moisturizer. Avoid the eyes.' },
  'kama-rose': { timing: 'Mist lightly onto clean skin from a comfortable distance, then follow with moisturizer.' },
  'reequil-matte': { precautions: 'Reapply at least every two hours outdoors and after swimming or sweating. Follow the pack’s water-resistance directions.' },
  'joseon-relief': {
    timing: 'Use as the final morning skincare step. The brand’s directions say to apply at least 30 minutes before going outside.',
    precautions: 'Reapply at least every two hours outdoors. Use a sunscreen labeled water resistant for swimming or heavy sweating.',
    source: { title: 'Beauty of Joseon Relief Sun label directions', url: 'https://beautyofjoseon.com/pages/relief-sun-cpnp-scpn-information' },
  },
  'true-chia': { quantity: 'The label lists a 25 g serving. Start with a smaller food portion if unfamiliar with chia, and hydrate it before eating.' },
  'fastup-reload': { quantity: 'The cited lime and lemon pack lists one tablet in 250 ml of water. Check the current tube before mixing.' },
  'ensure-vanilla': {
    quantity: 'Abbott lists about 55 g of powder in 190 ml of water for the standard preparation. Follow any different portion or consistency plan from the care team.',
    source: { title: 'Abbott India vanilla preparation and nutrition label', url: 'https://www.family.abbott/in-en/ensure/products/ensure-vanilla.html' },
  },
  'corength-pullup': {
    timing: 'Install only in a compatible doorway and test the mounting according to its manual before loading it.',
    precautions: 'Check the fitted configuration’s load limit. Inspect the mount before every session and avoid swinging.',
  },
  'domyos-dumbbells': { timing: 'Secure the selected plates with their collars before lifting. Lower the weights under control each time.' },
  'domyos-vest': { timing: 'Evenly secure the fitted plates and adjust the vest straps before any movement.' },
};

export function productDirections(product: Product): Directions {
  const kind = productKind(product);
  const defaults = directionsByKind[kind];
  const amount = kind === 'plant' && product.fitKey === 'pea-gold-chocolate' ? 'The cited label lists 25 g protein in a measured 40 g serving. Use the mixing ratio on the matching pack.'
    : product.serving && kind === 'oats' ? 'Use the planned portion, such as the 40 g example listed in Vitalform.'
      : defaults.quantity;
  return { ...defaults, quantity: amount, ...directionsByProduct[product.id] };
}

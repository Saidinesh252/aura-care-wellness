import { ArrowUpRight, Check, CircleAlert, Pin, Star } from 'lucide-react';
import { type Product, type ProductSlot, aggregateReviews } from '../products';
import { shoppingLinks } from '../catalogCommerce';
import { productKind, type CatalogKind } from '../catalogKinds';
import { formulaActives, potentFormula } from '../formulas';
import { useWorkspace } from '../store';
import { pinReplacementIds } from './PinnedRoutine';
import { MistakeGuardrailBanner, presetGuardrails, type GuardrailEntry } from './MistakeGuardrailBanner';

const slotNames: Partial<Record<ProductSlot, string>> = { Protect: 'AM sunscreen', Treat: 'PM treatment', Workout: 'Workout plan', Haircare: 'Wash-day care', LipCare: 'Lip care' };
export const slotLabel = (product: Product) => slotNames[product.slot] ?? product.slot;

export function catalogRestriction(product: Product, match: boolean) {
  if (product.clinicianReview) return 'Discuss with your care team';
  if (!match) return 'Outside your profile';
  return 'Outside your price tier';
}

export function PinButton({ product, canPin, blockedLabel }: { product: Product; canPin: boolean; blockedLabel: string }) {
  const { pinnedProducts, toggleProduct } = useWorkspace();
  const pinned = pinnedProducts.includes(product.id);
  const introduce = product.slot === 'Treat' && potentFormula(formulaActives(product.spec.join(' ')));
  return <button type="button" className={`button ${pinned ? 'secondary pinned-button' : 'primary'}`} aria-pressed={pinned} disabled={!canPin && !pinned}
    onClick={() => toggleProduct(product.id, pinReplacementIds(product), introduce)}>{pinned ? <Check size={15} /> : <Pin size={15} />}{pinned ? 'Pinned to routine' : canPin ? 'Pin to my daily routine' : blockedLabel}</button>;
}

export function ReviewBadge({ product }: { product: Product }) {
  const review = aggregateReviews(product);
  const label = product.sources.length > 1 ? 'ratings' : product.sources[0].unit;
  return <div className="review-badge">
    <span><Star size={14} fill="currentColor" aria-hidden="true" /> {review.stars.toFixed(1)}<small>/5</small></span>
    <span>{review.count.toLocaleString('en-IN')} {review.verified === review.count ? 'verified ' : ''}{label}</span>
  </div>;
}

export function ProductNotes({ product }: { product: Product }) {
  return <div className="product-notes">
    <strong>{product.fromReviews ? 'Top praised for' : 'Product highlights'}</strong>
    <ul>{product.positives.map(item => <li key={item}><Check size={14} /><span>{item}</span></li>)}</ul>
    <div className="product-catch"><CircleAlert size={15} /><p><strong>{product.criticalReview ? 'Watch out for' : 'What to check'} </strong>{product.drawback}</p></div>
  </div>;
}

const caution = (mistake: string, correction: string): readonly GuardrailEntry[] => [{ mistake, correction }];
const serving = caution('Estimating a powder serving or swallowing it dry.', 'Measure the current label’s serving and prepare it as directed. Check allergens and confirm suitability for your care plan.');
const supplements = caution('Stacking similar supplements or substituting them for prescribed treatment.', 'Review the current label and existing medicines with a pharmacist or care team before starting.');
const productCautions: Partial<Record<CatalogKind, readonly GuardrailEntry[]>> = {
  cleanser: presetGuardrails['skincare-cleanse'],
  serum: presetGuardrails['skincare-treatment'],
  moisturizer: presetGuardrails['skincare-moisture'],
  sunscreen: presetGuardrails['skincare-sunscreen'],
  lipBalm: caution('Continuing with a balm that makes lips sting or crack.', 'Pause the product and choose a tolerated plain balm. Reapply SPF lip protection outdoors as its label directs.'),
  shampoo: presetGuardrails['skincare-haircare'],
  natural: caution('Assuming plant-based products can be applied to broken or irritated skin.', 'Check the ingredient list and patch test as directed before regular use.'),
  bands: presetGuardrails['band-row'],
  mats: caution('Starting on a wet floor or letting the mat slide.', 'Lay the mat flat on a clean, dry surface and check its traction before moving.'),
  strength: caution('Loading unstable, loose or damaged equipment.', 'Check assembly and fasteners against the manual. Start with a manageable load and stop if movement causes pain.'),
  grips: caution('Forcing the gripper fully closed through hand or joint pain.', 'Choose a manageable resistance, use a comfortable range, and stop if symptoms increase.'),
  rollers: caution('Rolling over a recent injury or directly over painful joints or bony areas.', 'Use gentle pressure on the muscle, and stop if discomfort increases.'),
  pedals: caution('Pedalling from a rolling chair or with a shifting base.', 'Use a stable chair and non-slip surface. Adjust the resistance and stop if symptoms develop.'),
  scales: caution('Using body-composition mode without checking the manual’s health restrictions.', 'Check the instructions for implanted devices and use a stable surface.'),
  whey: serving,
  plant: serving,
  oats: caution('Assuming every oat variety can be cold-soaked.', 'Use oats labeled for soaking or cook as directed. Keep prepared oats chilled if storing.'),
  spreads: caution('Ignoring package allergen or shared-facility information.', 'Read the exact jar’s ingredients and cross-contact statement before use.'),
  seeds: caution('Swallowing a spoonful of dry chia as a standalone serving.', 'Mix chia into a suitable liquid or moist food and follow the label. Follow swallowing guidance from your care team when applicable.'),
  hydration: caution('Treating electrolyte mixes as interchangeable or adding extra tablets.', 'Follow the current label’s dilution and review its salt and sugar content against your care plan.'),
  vitamins: supplements,
  omega: supplements,
  seniorNutrition: supplements,
  performance: supplements,
};

export function ProductGuardrail({ product, collapsed = false }: { product: Product; collapsed?: boolean }) {
  return <MistakeGuardrailBanner category="product" title="What not to do" compact defaultExpanded={!collapsed}
    mistakes={productCautions[productKind(product)] ?? presetGuardrails.general} />;
}

export function BuyOptions({ product, compact = false }: { product: Product; compact?: boolean }) {
  const links = shoppingLinks(product);
  if (compact) return <div className="catalog-quick-buy">
    <div><strong>Where to buy</strong><small>Opens in a new tab</small></div>
    <span>{links.filter(link => link.type !== 'information').slice(0, 2).map(link => <a key={link.name} href={link.url} target="_blank" rel="noreferrer" aria-label={`${link.type === 'search' ? 'Search' : 'Open'} ${link.name} for ${product.name} (new tab)`}>{link.type === 'search' ? 'Search ' : ''}{link.name} <ArrowUpRight size={13} aria-hidden="true" /></a>)}</span>
  </div>;
  return <div className="source-list catalog-buy-list">
    {links.map(link => <a key={link.name} href={link.url} target="_blank" rel="noreferrer" aria-label={`${link.type === 'search' ? 'Search' : 'Open'} ${link.name} (new tab)`}>
      <span><strong>{link.name}</strong><small>{link.type === 'product' ? 'Product page' : link.type === 'search' ? 'Store search' : 'Official product information'}</small></span><ArrowUpRight size={17} aria-hidden="true" />
    </a>)}
  </div>;
}

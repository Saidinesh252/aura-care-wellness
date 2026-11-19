import { ArrowDownUp, ArrowUpRight, BadgeCheck, Bike, BookOpen, ChevronRight, CircleDot, ClipboardCheck, CupSoda, Droplet, Droplets, Dumbbell, Filter, Fish, FlaskConical, GlassWater, Hand, Layers, Leaf, Milk, Nut, Pill, PillBottle, Pin, Sandwich, Scale, Search, ShoppingBag, SprayCan, StretchHorizontal, Sun, Wallet, Wheat, Zap, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { budgets, environments, price, tiers, type Budget, type Currency, type Pillar } from '../context';
import { type UserBioProfile } from '../profile';
import { selectionChecklist } from '../catalogGuidance';
import { catalogKinds, productKind, type CatalogKind } from '../catalogKinds';
import { aggregateReviews, catalogDate, matchProduct, products, productTier, productTierLabels, productValue, type Product } from '../products';
import { useWorkspace } from '../store';
import type { WeatherSeason } from '../climate';
import { BuyOptions, PinButton, ProductGuardrail, ProductNotes, ReviewBadge, catalogRestriction, slotLabel } from './CatalogProductControls';
import { SafetyBanner } from './Evidence';
import { useProductProfile } from './PinnedRoutine';
import { ProductUsageModal } from './ProductUsageModal';
import { IconBadge, SelectField } from './Shared';
import { MistakeGuardrailBanner } from './MistakeGuardrailBanner';
import '../catalog.css';
import '../mealConstraints.css';

const categoryNames = { all: 'All essentials', skin: 'Skincare', fitness: 'Body & fitness', diet: 'Nutrition' } as const;
const sorts = { match: 'Highest profile match', rating: 'Highest rated', value: 'Best price-to-performance', reviewed: 'Most reviewed' } as const;
type Sort = keyof typeof sorts;
type Category = Pillar | 'all';
type CatalogEntry = { product: Product; match: ReturnType<typeof matchProduct>; canPin: boolean };
const categoryEntries = Object.entries(categoryNames) as [Category, string][];
const subcategoryEntries = Object.entries(catalogKinds) as [CatalogKind, (typeof catalogKinds)[CatalogKind]][];
const kindIcons: Record<CatalogKind, LucideIcon> = {
  cleanser: Droplets, serum: FlaskConical, moisturizer: Droplet, sunscreen: Sun, lipBalm: PillBottle, shampoo: SprayCan, natural: Leaf,
  bands: StretchHorizontal, mats: Layers, strength: Dumbbell, grips: Hand, rollers: CircleDot, pedals: Bike, scales: Scale,
  whey: Milk, plant: Leaf, oats: Wheat, spreads: Nut, seeds: Leaf, snacks: Sandwich, hydration: GlassWater,
  vitamins: Pill, omega: Fish, seniorNutrition: CupSoda, performance: Zap,
};
const pageSize = 12;
const searchText = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[\p{Mark}'’]/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function seasonalPriority(product: Product, season: WeatherSeason) {
  const kind = productKind(product);
  if (season === 'summer' && kind === 'sunscreen' && /SPF\s*50/i.test(product.spec.join(' '))) return 8;
  if (season === 'winter' && (kind === 'lipBalm' || (kind === 'moisturizer' && /ceramide/i.test(product.spec.join(' '))))) return 8;
  if (season === 'monsoon' && kind === 'mats') return 6;
  if (season === 'pollution' && (kind === 'cleanser' || (product.pillar === 'fitness' && product.dorm))) return 5;
  return 0;
}

function ProductCard({ item, currency, onInspect, fallback = false }: { item: CatalogEntry; currency: Currency; onInspect: () => void; fallback?: boolean }) {
  const { product, match, canPin } = item;
  const kind = productKind(product);
  const KindIcon = kindIcons[kind];
  const review = aggregateReviews(product);
  const consensus = review.count >= 1000 ? 'Widely reviewed' : review.stars >= 4.6 ? 'Highly rated' : 'Community rated';
  const restriction = catalogRestriction(product, Boolean(match));
  return <article className="card product-card catalog-product-card">
    <div className={`product-visual tone-${product.pillar}`}>
      <IconBadge pillar={product.pillar}><KindIcon size={24} strokeWidth={1.8} aria-hidden="true" /></IconBadge>
      {match && <span className="match-chip"><BadgeCheck size={15} />{match.score}% match</span>}
      <span className="product-category">{catalogKinds[kind].name}</span>
    </div>
    <div className="product-content">
      <div className="product-brand">{product.brand}<span>{product.dorm ? 'PG-friendly' : 'Needs home space'}</span></div>
      {fallback && <span className="constraint-match">Best Match for Your Constraints</span>}
      <h3>{product.name}</h3><p className="product-pack">{product.pack}</p>
      <div className="product-review-row"><ReviewBadge product={product} /><span className="consensus-label">{consensus}</span></div>
      <ProductNotes product={product} />
      <div className="product-footer">
        <div><strong>{price(product.price, currency, true)}</strong><small>{productTierLabels[productTier(product.price)]}</small></div>
        <button className="button secondary catalog-inspect" onClick={onInspect} aria-label={`How to use, formula and reviews for ${product.name}`}>How to use <ArrowUpRight size={15} aria-hidden="true" /></button>
      </div>
      <BuyOptions product={product} compact />
      <PinButton product={product} canPin={canPin} blockedLabel={restriction} />
      <ProductGuardrail product={product} collapsed />
    </div>
  </article>;
}

export function MonthlyBudget({ profile, currency }: { profile: UserBioProfile; currency: Currency }) {
  const { pinnedProducts, toggleProduct, monthlyLimit, setMonthlyLimit } = useWorkspace();
  const pins = products.filter(product => pinnedProducts.includes(product.id));
  const total = pins.reduce((amount, product) => amount + product.price, 0);
  const limit = monthlyLimit ?? budgets[profile.budget].maximum ?? 10000;
  const remaining = limit - total;
  const used = Math.round(Math.min(100, limit > 0 ? total / limit * 100 : total > 0 ? 100 : 0));
  return <aside className="budget-panel">
    <div className="budget-heading"><span><Wallet size={17} /> Monthly wellness budget</span><strong>{price(total, currency)}</strong><small>{pins.length} pinned {pins.length === 1 ? 'item' : 'items'} · one pack per item</small></div>
    <div className="budget-progress" role="progressbar" aria-label="Monthly budget used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={used}><span style={{ width: `${used}%` }} /></div>
    <div className="budget-balance"><span>{remaining < 0 ? `${price(-remaining, currency)} above target` : `${price(remaining, currency)} available`}</span><span>{price(limit, currency)} target</span></div>
    <label className="budget-edit"><span>Set limit in INR</span><input type="number" min={0} step={100} max={1000000} placeholder={String(limit)} value={monthlyLimit ?? ''} onChange={event => {
      const value = event.target.value;
      setMonthlyLimit(value === '' ? null : Math.min(1000000, Math.max(0, Number(value))));
    }} /></label>
    {pins.length > 0 && <div className="budget-pins">{pins.map(product => {
      const compatible = matchProduct(product, profile, true);
      return <div key={product.id}><span><strong>{product.brand} {product.name}</strong><small>{compatible ? slotLabel(product) : 'Outside current profile'} · {price(product.price, currency)}</small></span>
        <button className="plain-icon" aria-label={`Unpin ${product.name}`} onClick={() => toggleProduct(product.id)}><Pin size={14} fill="currentColor" /></button></div>;
    })}</div>}
  </aside>;
}

function SelectionGuide({ category, kind }: { category: Category; kind: CatalogKind | 'all' }) {
  const checklist = selectionChecklist(kind, category);
  return <details className="catalog-checklist" open>
    <summary><span><ClipboardCheck size={18} /> Smart selection checklist</span><small>{checklist.title}</small></summary>
    <div>{checklist.points.map(point => <label key={point}><input type="checkbox" /> <span>{point}</span></label>)}</div>
  </details>;
}

export function FullProductCatalog({ target, onEdit }: { target?: string; onEdit: () => void }) {
  const { profile: storedProfile, currency, weatherSeason } = useWorkspace();
  const profile = useProductProfile();
  const [category, setCategory] = useState<Category>('all');
  const [kind, setKind] = useState<CatalogKind | 'all'>('all');
  const [tier, setTier] = useState<Budget | 'all'>('all');
  const [view, setView] = useState<'all' | 'matched'>('matched');
  const [sort, setSort] = useState<Sort>('match');
  const [dormOnly, setDormOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState(target);
  const [visible, setVisible] = useState(pageSize);
  useEffect(() => setOpened(target), [target]);

  const catalog = products.map(product => {
    const match = matchProduct(product, profile, true);
    return { product, match, canPin: Boolean(match && productTier(product.price) === profile.budget) };
  });
  const matchCount = catalog.filter(item => item.canPin).length;
  const browseAll = view === 'all';
  const tokens = searchText(query).split(' ').filter(Boolean);
  const fitsQuery = (product: Product) => {
    const searchable = searchText(`${product.brand} ${product.name} ${product.pack} ${catalogKinds[productKind(product)].name} ${product.spec.join(' ')}`);
    return tokens.every(word => searchable.includes(word));
  };
  const ordered = catalog.filter(({ product, canPin }) => {
    if ((!browseAll && !canPin) || (category !== 'all' && category !== product.pillar) || (kind !== 'all' && kind !== productKind(product))) return false;
    if ((browseAll && tier !== 'all' && tier !== productTier(product.price)) || (dormOnly && !product.dorm)) return false;
    return fitsQuery(product);
  }).sort((a, b) => {
    const left = aggregateReviews(a.product);
    const right = aggregateReviews(b.product);
    const fit = (item: CatalogEntry) => item.match ? item.match.score + seasonalPriority(item.product, weatherSeason) : 0;
    const matchOrder = Number(b.canPin) - Number(a.canPin) || fit(b) - fit(a);
    return (sort === 'rating' ? right.stars - left.stars : sort === 'reviewed' ? right.count - left.count : sort === 'value' ? productValue(b.product) - productValue(a.product) : matchOrder) ||
      right.stars - left.stars || right.count - left.count;
  });
  const budgetCeiling = Math.min(tiers.indexOf(profile.budget), tier === 'all' ? tiers.length - 1 : tiers.indexOf(tier));
  const fallbackFit = (item: CatalogEntry) => Number(fitsQuery(item.product)) * 10
    + Number(category !== 'all' && category === item.product.pillar) * 8
    + Number(kind !== 'all' && kind === productKind(item.product)) * 12
    + (item.match?.score ?? 0) / 20
    + seasonalPriority(item.product, weatherSeason) / 20;
  const fallbackPicks = ordered.length ? [] : catalog.filter(item => item.match
    && tiers.indexOf(productTier(item.product.price)) <= budgetCeiling
    && (!dormOnly || item.product.dorm))
    .sort((left, right) => fallbackFit(right) - fallbackFit(left) || left.product.price - right.product.price)
    .slice(0, 4);
  const inspecting = products.find(product => product.id === opened);

  function resetFilters() {
    setCategory('all');
    setKind('all');
    setTier('all');
    setDormOnly(false);
    setQuery('');
    setVisible(pageSize);
  }

  return <>
    <div className="page-intro"><div><span className="page-eyebrow tone-diet"><ShoppingBag size={16} /> Product discovery</span><h1>Top-Reviewed Gear &amp; Essentials</h1><p>Find products that fit your routine, compare store listings and see how to use each one.</p></div><button className="button secondary" onClick={onEdit}>{storedProfile ? 'Edit bio-profile' : 'Build bio-profile'} <ChevronRight size={15} /></button></div>
    <SafetyBanner />
    <div className="gear-hero catalog-hero">
      <div className="gear-hero-summary">
        <span className="profile-kicker"><BadgeCheck size={16} /> {storedProfile ? 'Matched to your bio-profile' : 'Matched to your workspace settings'}</span>
        <h2>{matchCount} picks for your setup</h2>
        <div className="gear-context"><span>{environments[profile.environment].label}</span><span>{productTierLabels[profile.budget]}</span><span>{profile.skin} skin</span><span>{profile.diet}</span></div>
        <p>Catalog tiers apply per pack. Pinned products count toward your monthly budget.</p>
      </div>
      <MonthlyBudget profile={profile} currency={currency} />
    </div>
    <section className="module-section catalog-section">
      <div className="catalog-view" role="group" aria-label="Catalog view">
        <button className="choice-chip" type="button" aria-pressed={!browseAll} onClick={() => { setView('matched'); setVisible(pageSize); }}><BadgeCheck size={16} /> Matched for me <span>{matchCount}</span></button>
        <button className="choice-chip" type="button" aria-pressed={browseAll} onClick={() => { setView('all'); setVisible(pageSize); }}><ShoppingBag size={16} /> All products <span>{products.length}</span></button>
      </div>
      <div className="section-head"><div><h2>{browseAll ? 'Browse the full catalog' : 'Browse your matches'}</h2>
        <p>{browseAll ? 'Explore every tier and category. Pin choices that fit your active profile and price tier.' : 'Filtered by your skin, diet, goals, space and per-item price tier.'}</p></div></div>
      <div className="gear-filters catalog-filters">
        <div className="choice-row" role="group" aria-label="Product category">{categoryEntries.map(([key, name]) =>
          <button type="button" key={key} aria-pressed={category === key} className="choice-chip" onClick={() => { setCategory(key); setKind('all'); setVisible(pageSize); }}>{name}</button>)}</div>
        <div className="gear-filter-controls catalog-filter-controls">
          <label className="search-input"><Search size={16} /><input aria-label="Find a product" placeholder="Search names, brands or ingredients" value={query} onChange={event => { setQuery(event.target.value); setVisible(pageSize); }} /></label>
          <SelectField icon={<Filter size={15} />} aria-label="Product subcategory" value={kind} onChange={event => { setKind(event.target.value as CatalogKind | 'all'); setVisible(pageSize); }}>
            <option value="all">All subcategories</option>
            {subcategoryEntries.filter(([, group]) => category === 'all' || group.pillar === category).map(([key, group]) => <option key={key} value={key}>{group.name}</option>)}
          </SelectField>
          {browseAll && <SelectField icon={<Wallet size={15} />} aria-label="Product price tier" value={tier} onChange={event => { setTier(event.target.value as Budget | 'all'); setVisible(pageSize); }}>
            <option value="all">All price tiers</option>
            {tiers.map(key => <option key={key} value={key}>{productTierLabels[key]}</option>)}
          </SelectField>}
          <SelectField icon={<ArrowDownUp size={15} />} aria-label="Sort products" value={sort} onChange={event => { setSort(event.target.value as Sort); setVisible(pageSize); }}>
            {Object.entries(sorts).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </SelectField>
          <button type="button" className="choice-chip dorm-filter" aria-pressed={dormOnly || (!browseAll && profile.environment === 'pg')} disabled={!browseAll && profile.environment === 'pg'} onClick={() => { setDormOnly(!dormOnly); setVisible(pageSize); }}><Filter size={15} /> PG-friendly only</button>
        </div>
      </div>
      <SelectionGuide key={`${category}-${kind}`} category={category} kind={kind} />
      <p className="catalog-count" role="status">Showing {Math.min(visible, ordered.length)} of {ordered.length} {browseAll ? 'catalog results' : 'compatible picks'}</p>
      {fallbackPicks.length > 0 && <p className="fine-print">No exact results. These alternatives keep your profile, space, and maximum budget. They may differ from your search or selected category.</p>}
      {ordered.length > 0 || fallbackPicks.length > 0
        ? <div className="products-grid">{(ordered.length ? ordered.slice(0, visible) : fallbackPicks).map(item => <ProductCard key={item.product.id} item={item} currency={currency} onInspect={() => setOpened(item.product.id)} fallback={!ordered.length} />)}</div>
        : <div className="card empty-search"><ShoppingBag size={26} /><h2>No compatible purchase for this combination</h2><p>Open your plan for routines using what you have, or clear the product filters.</p>
          <a className="button secondary" href="#blueprint">Open my personal plan</a>
          <button className="button secondary" onClick={resetFilters}>Clear product filters</button>
          {!browseAll && <button className="button secondary" onClick={() => { setView('all'); resetFilters(); }}>Browse all products</button>}</div>}
      {visible < ordered.length && <div className="catalog-more"><button className="button secondary" onClick={() => setVisible(visible + pageSize)}>Show {Math.min(pageSize, ordered.length - visible)} more products</button></div>}
      <MistakeGuardrailBanner category="product" title="⚠️ Gear & Supplement Safety: Common Pitfalls" />
      <details className="review-method"><summary><BookOpen size={16} /> How ratings, prices and matches are calculated</summary>
        <p>Retailer snapshots checked around {catalogDate}. Prices are estimates. Availability, formulas and counts can change. Published ratings are weighted by their counts. Totals can include shoppers who rated on more than one store. Notes drawn from public comments are labeled separately from product highlights.</p>
        <p>Fit scores use product compatibility, goal or concern alignment, and environment. Value uses the source rating and estimated cost per pack unit.</p>
        <p>Pack tiers are below {price(300, currency)}, {price(300, currency)}–{price(999, currency)}, {price(1000, currency)}–{price(3499, currency)}, and {price(3500, currency)} or more.</p>
      </details>
    </section>
    {inspecting && <ProductUsageModal key={inspecting.id} product={inspecting} profile={profile} currency={currency} onClose={() => setOpened(undefined)} />}
  </>;
}

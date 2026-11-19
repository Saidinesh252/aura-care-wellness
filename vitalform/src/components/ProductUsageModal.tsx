import { ArrowUpRight, BadgeCheck, Check, ClipboardCheck, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { type Currency, price } from '../context';
import { type UserBioProfile } from '../profile';
import { aggregateReviews, budgetAlternative, matchProduct, type Product } from '../products';
import { productDirections, selectionChecklist } from '../catalogGuidance';
import { productKind } from '../catalogKinds';
import { shoppingLinks } from '../catalogCommerce';
import { BuyOptions, PinButton, ProductGuardrail, ProductNotes, ReviewBadge, catalogRestriction, slotLabel } from './CatalogProductControls';
import { EvidenceInfo } from './Evidence';
import { IconBadge, Modal } from './Shared';

export function ProductUsageModal({ product, profile, currency, onClose }: { product: Product; profile: UserBioProfile; currency: Currency; onClose: () => void }) {
  const [comparing, compare] = useState(false);
  const match = matchProduct(product, profile, true);
  const canPin = Boolean(matchProduct(product, profile));
  const restriction = catalogRestriction(product, Boolean(match));
  const alternative = budgetAlternative(product, profile);
  const rating = aggregateReviews(product);
  const directions = productDirections(product);
  const checklist = selectionChecklist(productKind(product), product.pillar);
  const primaryStore = shoppingLinks(product).find(link => link.type === 'product');
  const steps = [
    ['Amount or setup', directions.quantity], ['When & where in the routine', directions.timing], ['Frequency & precautions', directions.precautions],
  ];
  return <Modal title="How to use, formula & reviews" variant="drawer" onClose={onClose}>
    <div className={`drawer-product tone-${product.pillar}`}><IconBadge pillar={product.pillar} /><div><span>{product.brand} · {product.pack}</span><h3>{product.name}</h3><ReviewBadge product={product} /></div></div>
    <section className="drawer-section profile-fit">
      {match ? <>
        <span className="match-chip"><BadgeCheck size={15} /> {match.score}% match</span><h3>Why it fits your profile</h3>
        <ul>{match.reasons.map(reason => <li key={reason}><Check size={14} /> {reason}</li>)}</ul>
        {!canPin && <p className="fine-print">This pack falls outside your current per-item price tier.</p>}
      </> : <><h3>{restriction}</h3><p className="muted">{product.clinicianReview ? 'Ask a clinician or pharmacist if this product fits the member’s needs and current medicines.' : 'This product is available to explore in the full catalog. Your matched picks reflect the active profile and workspace.'}</p></>}
    </section>
    <section className="drawer-section catalog-directions"><h3>Directions for use</h3>
      <ol>{steps.map(([title, description]) => <li key={title}><div><strong>{title}</strong><p>{description}</p></div></li>)}</ol>
      <ProductGuardrail product={product} />
      <p className="fine-print">Follow the label or manual for the exact variant.</p>
      {directions.source && <a href={directions.source.url} target="_blank" rel="noreferrer">{directions.source.title} <ArrowUpRight size={13} aria-hidden="true" /></a>}
      {primaryStore && <a href={primaryStore.url} target="_blank" rel="noreferrer">View the product label at {primaryStore.name} <ArrowUpRight size={13} aria-hidden="true" /></a>}
    </section>
    <section className="drawer-section"><h3>Formula & specifications</h3>
      <ul className="spec-list">{product.spec.map(spec => <li key={spec}>{spec} <EvidenceInfo rule={/\bspf\b/i.test(spec) ? 'spf' : /ceramide|gentle cleanser/i.test(spec) ? 'skin' : /niacinamide|salicylic/i.test(spec) ? 'active' : product.natural ? 'diy' : /protein.*(?:scoop|serving)/i.test(spec) ? 'protein' : 'label'} compact /></li>)}</ul>
      {product.serving && <p className="fine-print">{product.serving.size} · {product.serving.macros.protein} g protein · {product.serving.macros.calories} kcal</p>}
      {product.allergens?.length ? <p className="fine-print">Catalog allergen flags: {product.allergens.join(', ')}. Check the current label for ingredients and cross-contact.</p> : null}
      <p className="fine-print">Routine placement · {slotLabel(product)}</p>
    </section>
    <section className="drawer-section catalog-drawer-checklist"><h3><ClipboardCheck size={17} /> Smart selection checklist</h3>
      {checklist.points.map(point => <label key={point}><input type="checkbox" /> <span>{point}</span></label>)}
    </section>
    <section className="drawer-section"><h3>Where to buy</h3>
      <p className="muted">Compare the exact size, variant, seller and current price before buying. Store links open in a new tab.</p>
      <BuyOptions product={product} />
    </section>
    <section className="drawer-section"><h3>The good & the catch</h3><ProductNotes product={product} /></section>
    <section className="drawer-section"><h3>Review sources</h3>
      <p className="muted">Ratings are weighted by published counts. Retailers can pool sizes or flavours. The verified count includes only retailer-marked ratings.</p>
      {rating.verified > 0 && <p className="fine-print">{rating.verified.toLocaleString('en-IN')} ratings marked verified by their retailer.</p>}
      <div className="source-list">{product.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
        <span><strong>{source.retailer}</strong><small>{source.stars} / 5 · {source.count.toLocaleString('en-IN')} {source.verified ? 'verified ' : ''}{source.unit}</small></span><ArrowUpRight size={17} aria-hidden="true" />
      </a>)}</div>
    </section>
    <section className="drawer-section">
      <button type="button" className="button secondary comparison-toggle" aria-expanded={comparing} onClick={() => compare(!comparing)}><SlidersHorizontal size={16} /> {comparing ? 'Hide' : 'Compare'} budget alternative</button>
      {comparing && (alternative ? <div className="product-compare">
        {[product, alternative].map(item => <div key={item.id}>
          <strong>{item.brand} {item.name}</strong><small>{item.pack}</small><span>{price(item.price, currency, true)} · ★ {aggregateReviews(item).stars.toFixed(1)}</span>
          <a href={item.sources[0].url} target="_blank" rel="noreferrer">View source <ArrowUpRight size={13} aria-hidden="true" /></a>
        </div>)}
        <p className="fine-print">These products share the same comparison ingredient, spec or formulation. Check the full labels and pack sizes.</p>
      </div> : <p className="fine-print">No lower-priced option meets the rating, formula or specification and profile criteria.</p>)}
    </section>
    <div className="drawer-footer"><strong>{price(product.price, currency, true)}</strong><PinButton product={product} canPin={canPin} blockedLabel={restriction} /></div>
  </Modal>;
}

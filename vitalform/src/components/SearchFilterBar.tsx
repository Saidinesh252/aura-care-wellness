import { useEffect, useRef } from 'react';
import { ArrowUpRight, Clock3, ListFilter, MapPin, Search, Shapes, Wallet, X } from 'lucide-react';
import { budgetRange, budgets, environments, goals, pillars, places, price, tiers, type Budget, type DiscoveryItem, type Environment, type Pillar } from '../context';
import { useWorkspace } from '../store';
import { PillarLabel, SelectField } from './Shared';

export interface SearchFilters { query: string; pillar: Pillar | 'all'; tag: string }
export const defaultFilters: SearchFilters = { query: '', pillar: 'all', tag: '' };

export function SearchFilterBar({ filters, onChange }: { filters: SearchFilters; onChange: (filters: SearchFilters) => void }) {
  const { environment, budget, currency, setEnvironment, setBudget } = useWorkspace();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !document.querySelector('dialog[open]')) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  return <div className="search-bar" role="search" aria-label="Search and filter your plan">
    <div className="search-input">
      <Search size={19} aria-hidden="true" />
      <input ref={input} value={filters.query} placeholder="Search routines, meals, products…" aria-label="Search routines, meals, products" onChange={event => onChange({ ...filters, query: event.target.value })}
        onKeyDown={event => { if (event.key === 'Escape') onChange(defaultFilters); }} />
      {filters.query ? <button className="plain-icon" aria-label="Clear search" onClick={() => { onChange({ ...filters, query: '' }); input.current?.focus(); }}><X size={15} /></button> : <kbd>Ctrl K</kbd>}
    </div>
    <div className="filter-options">
      <SelectField aria-label="Living environment" icon={<MapPin size={16} />} value={environment} onChange={event => setEnvironment(event.target.value as Environment)}>
        {places.map(place => <option key={place} value={place}>{environments[place].label}</option>)}
      </SelectField>
      <SelectField aria-label="Budget tier" icon={<Wallet size={16} />} value={budget} onChange={event => setBudget(event.target.value as Budget)}>
        {tiers.map(tier => <option key={tier} value={tier} title={`${budgets[tier].label} · ${budgetRange(tier, currency)}`}>{budgets[tier].short}</option>)}
      </SelectField>
      <SelectField aria-label="Wellness pillar" icon={<Shapes size={16} />} value={filters.pillar} onChange={event => onChange({ ...filters, pillar: event.target.value as SearchFilters['pillar'] })}>
        <option value="all">All pillars</option>
        {Object.entries(pillars).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
      </SelectField>
      <SelectField aria-label="Time or goal" icon={<ListFilter size={16} />} value={filters.tag} onChange={event => onChange({ ...filters, tag: event.target.value })}>
        <option value="">Time &amp; goal</option>
        <optgroup label="Time"><option value="quick">Quick (&lt;10 min)</option><option value="deep">Deep (30–60 min)</option></optgroup>
        <optgroup label="Goal">{goals.map(goal => <option key={goal}>{goal}</option>)}</optgroup>
      </SelectField>
    </div>
  </div>;
}

export function filterDiscovery(items: DiscoveryItem[], filters: SearchFilters) {
  const words = filters.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    const searchable = [item.title, item.description, pillars[item.pillar], ...item.tags].join(' ').toLowerCase();
    const timeOrGoal = filters.tag === '' ||
      (filters.tag === 'quick' && item.minutes > 0 && item.minutes < 10) ||
      (filters.tag === 'deep' && item.minutes >= 30 && item.minutes <= 60) ||
      item.tags.some(tag => tag === filters.tag);
    return (filters.pillar === 'all' || item.pillar === filters.pillar) && timeOrGoal && words.every(word => searchable.includes(word));
  });
}

export function SearchResults({ items, onOpen, onClear }: { items: DiscoveryItem[]; onOpen: (item: DiscoveryItem) => void; onClear: () => void }) {
  const currency = useWorkspace(state => state.currency);
  return <section className="search-results">
    <div className="section-head"><div><h1>Find in your plan</h1><p aria-live="polite">{items.length} {items.length === 1 ? 'result' : 'results'} for your current setup</p></div><button className="button secondary" onClick={onClear}><X size={15} /> Clear search filters</button></div>
    {items.length > 0 ? <div className="results-grid">
      {items.map(item => <button key={item.id} className="result-card card" onClick={() => onOpen(item)}>
        <span className="result-top"><PillarLabel pillar={item.pillar} /><ArrowUpRight size={16} /></span>
        <strong>{item.title}</strong><span className="muted">{item.description}</span>
        <span className="result-meta">{item.minutes ? <span><Clock3 size={14} /> {item.minutes} min</span> : <span>Gear &amp; essentials</span>}<span>{item.amount ? price(item.amount, currency, true) : 'No extra cost'}</span></span>
      </button>)}
    </div> : <div className="card empty-search"><Search size={26} /><h2>No matches for these filters</h2><p>Try a broader search or choose a different time or goal.</p></div>}
  </section>;
}

import { Check, ChevronDown, Clock3, Plus, RefreshCw, Search, Sparkles, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { emptyJournal, useWorkspace } from '../store';
import { cuisineLabels, isSeasonalRecipe, regionalRecipeMatches, regionalRecipeMeetsSafety, regionalRecipes } from '../regionalRecipes';
import type { DefaultCuisine } from '../store';
import { inferredSlot } from '../adaptive';
import { ReadAloudButton } from './ReadAloudButton';
import { MistakeGuardrailBanner } from './MistakeGuardrailBanner';
import { climateProtocols } from './WeatherProtectionShield';
import './regionalRecipe.css';

export function RegionalRecipeEngine({ today }: { today: string }) {
  const { environment, diet, budget, profile, weatherSeason, defaultCuisine, setDefaultCuisine, days, toggleMeal } = useWorkspace();
  const [allForCuisine, setAllForCuisine] = useState<DefaultCuisine | null>(null);
  const [requestedSetup, setSetupFilter] = useState<'All' | 'PG' | 'Stove'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const loggedMeals = (days[today] ?? emptyJournal).meals;
  const selectedCuisine = allForCuisine === defaultCuisine ? 'all' : defaultCuisine;
  const setupFilter = environment !== 'home' ? 'PG' : requestedSetup;

  const compatible = useMemo(() => regionalRecipes
    .filter(recipe => regionalRecipeMatches(recipe, diet, profile?.exclusions ?? [], environment, budget) && regionalRecipeMeetsSafety(recipe, profile))
    .sort((left, right) => Number(isSeasonalRecipe(right, weatherSeason)) - Number(isSeasonalRecipe(left, weatherSeason))),
  [diet, profile, environment, budget, weatherSeason]);
  const terms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filteredRecipes = compatible.filter(recipe => {
    if (selectedCuisine !== 'all' && recipe.cuisine !== cuisineLabels[selectedCuisine]) return false;
    if ((setupFilter === 'PG' && !recipe.dormFriendly) || (setupFilter === 'Stove' && recipe.dormFriendly)) return false;
    const searchable = [recipe.name, recipe.cookingSwap, ...recipe.ingredients.map(ingredient => ingredient.name)].join(' ').toLowerCase();
    return terms.every(term => searchable.includes(term));
  });
  const fallbackRecipes = !filteredRecipes.length ? compatible.slice(0, 4) : [];
  const displayed = filteredRecipes.length ? filteredRecipes : fallbackRecipes;

  return (
    <section className="regional-recipe-engine" aria-labelledby="regional-library-heading">
      <div className="regional-engine-head">
        <div>
          <h2 id="regional-library-heading">
            <UtensilsCrossed size={22} /> Pan-Indian &amp; Regional Recipe Library
          </h2>
          <p>
            North and South Indian staples and quick meals. Results use your active profile, kitchen access and budget.
          </p>
        </div>
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            setAllForCuisine(null);
            setSetupFilter('All');
            setSearchQuery('');
          }}
        >
          <RefreshCw size={14} /> Reset Filters
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="regional-filter-bar">
        <div className="regional-tabs-row" role="group" aria-label="Regional cuisine">
          {(['all', 'south-indian', 'north-indian', 'pan-indian'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={selectedCuisine === tab}
              className={`regional-tab-btn ${selectedCuisine === tab ? 'active' : ''}`}
              onClick={() => {
                if (tab === 'all') setAllForCuisine(defaultCuisine);
                else { setDefaultCuisine(tab); setAllForCuisine(null); }
              }}
            >
              {tab === 'all' ? 'All cuisines' : cuisineLabels[tab]}
            </button>
          ))}
        </div>

        <div className="regional-chips-row">
          <div className="regional-search-field">
            <Search size={15} />
            <input
              type="search"
              placeholder="Search by recipe, ingredient (sattu, ragi, rajma, oats...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search regional recipes"
            />
          </div>

          <select
            className="regional-chip-select"
            value={setupFilter}
            disabled={environment !== 'home'}
            onChange={(e) => setSetupFilter(e.target.value as 'All' | 'PG' | 'Stove')}
            aria-label="Filter by kitchen equipment"
          >
            <option value="All">All Kitchen Setups</option>
            <option value="PG">⚡ PG No-Cook / Kettle Friendly</option>
            {environment === 'home' && <option value="Stove">🍳 Home Kitchen / Stove</option>}
          </select>

          <span className="regional-chip-select">{diet} · {climateProtocols[weatherSeason].name}</span>
        </div>
      </div>

      {/* Recipe Cards Grid */}
      <p className="fine-print" role="status">{filteredRecipes.length} recipes · Estimated nutrition per listed serving. Check packaged foods and shared-kitchen cross-contact. <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noreferrer">USDA food composition</a> · <a href="https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-produce-safely" target="_blank" rel="noreferrer">FDA produce safety</a></p>
      {fallbackRecipes.length > 0 && <p className="card empty-search">No exact results. These recipes keep your active profile, kitchen, and budget requirements.</p>}
      {!displayed.length && <div className="card empty-search"><p>The library has no compatible recipe for these requirements.</p><a className="button secondary" href="#smart-meals" onClick={event => { event.preventDefault(); document.getElementById('smart-meals')?.scrollIntoView({ block: 'start' }); }}>See your daily plan</a></div>}
      <div className="regional-grid">
        {displayed.map((recipe) => {
          const isExpanded = expandedRecipeId === recipe.id;
          const isLogged = Boolean(loggedMeals[recipe.id]);
          const slotOccupied = !isLogged && Object.entries(loggedMeals).some(([id, meal]) => inferredSlot(id, meal) === recipe.slot);

          const cuisineClass = recipe.cuisine === 'South Indian'
            ? 'south'
            : recipe.cuisine === 'North Indian'
            ? 'north'
            : 'pan';

          return (
            <article key={recipe.id} className="regional-card">
              <div className="regional-card-header">
                <div className="regional-badge-group">
                  <span className={`regional-badge ${cuisineClass}`}>{recipe.cuisine}</span>
                  <span className={`regional-badge ${recipe.dormFriendly ? 'setup-pg' : 'setup-stove'}`}>
                    {recipe.dormFriendly ? '⚡ PG Kettle / No-Cook' : '🍳 Stove'}
                  </span>
                  {isSeasonalRecipe(recipe, weatherSeason) && <span className="regional-badge setup-pg">Season pick</span>}
                  {fallbackRecipes.length > 0 && <span className="regional-badge setup-pg">Best Match for Your Constraints</span>}
                </div>
                <span className="muted" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock3 size={13} /> {recipe.prepMinutes} min
                </span>
              </div>

              <h3>{recipe.name}</h3>

              {/* Exact Macros Card */}
              <div className="regional-macros-row" aria-label="Nutritional Breakdown">
                <div className="regional-macro-cell">
                  <span>Calories</span>
                  <strong>{recipe.calories} kcal</strong>
                </div>
                <div className="regional-macro-cell">
                  <span>Protein</span>
                  <strong>{recipe.protein}g</strong>
                </div>
                <div className="regional-macro-cell">
                  <span>Carbs</span>
                  <strong>{recipe.carbs}g</strong>
                </div>
                <div className="regional-macro-cell">
                  <span>Fat</span>
                  <strong>{recipe.fat}g</strong>
                </div>
                <div className="regional-macro-cell fiber-cell">
                  <span>Fiber</span>
                  <strong>{recipe.fiber}g</strong>
                </div>
              </div>

              {/* Healthy Cooking Swap Callout */}
              <div className="regional-swap-box">
                <strong>
                  <Sparkles size={13} /> Healthy Cooking Swap
                </strong>
                <span>{recipe.cookingSwap}</span>
              </div>
              <MistakeGuardrailBanner category="diet" compact defaultExpanded={false}
                mistakes={[{ mistake: recipe.trapToAvoid, correction: `Use ${recipe.equipment.toLowerCase()} and follow the preparation steps and pack directions.` }]} />

              {/* Actions Footer */}
              <div className="regional-card-footer">
                <button
                  type="button"
                  className="button secondary"
                  style={{ fontSize: '11.5px', padding: '5px 10px' }}
                  onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? 'Hide Details' : 'View Prep & Recipe'}
                  <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    className={`button ${isLogged ? 'secondary logged' : 'primary'}`}
                    aria-pressed={isLogged}
                    disabled={slotOccupied}
                    style={{ fontSize: '11.5px', padding: '5px 12px' }}
                    onClick={() =>
                      toggleMeal(recipe.id, {
                        name: recipe.name,
                        macros: {
                          calories: recipe.calories,
                          protein: recipe.protein,
                          carbs: recipe.carbs,
                          fat: recipe.fat,
                        },
                        slot: recipe.slot,
                      })
                    }
                  >
                    {isLogged ? <Check size={14} /> : <Plus size={14} />}
                    {isLogged ? 'Serving logged' : slotOccupied ? 'Meal slot logged' : `Log ${recipe.slot.toLowerCase()}`}
                  </button>
                </div>
              </div>

              {/* Expanded Recipe & Method Section */}
              {isExpanded && (
                <div className="regional-details-accordion">
                  <div>
                    <strong>Equipment Needed:</strong> {recipe.equipment}
                  </div>

                  <div>
                    <strong>Ingredients &amp; Portions:</strong>
                    <ul>
                      {recipe.ingredients.map((ing) => (
                        <li key={ing.name}>
                          {ing.name} — <strong>{ing.amount}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong>Preparation Method:</strong>
                    <ol>
                      {recipe.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <ReadAloudButton
                    text={`${recipe.name}. Ingredients: ${recipe.ingredients.map((i) => `${i.name} ${i.amount}`).join(', ')}. Method: ${recipe.steps.join(' ')}`}
                    label="Read recipe aloud"
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

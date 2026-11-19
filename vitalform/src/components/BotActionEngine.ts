import { environments, localDate, price, type Page } from '../context';
import { useWorkspace } from '../store';
import { personalizedMealPlan } from '../personalizedNutrition';
import { calculateProfile, createProfile } from '../profile';
import { climateHydrationBonus } from '../climate';
import { answerPip } from '../pipAssistant';

export interface BotActionChip {
  id: string;
  label: string;
  icon?: string;
  run: (navigate: (page: Page, target?: string) => void) => string;
}

export interface BotMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  actions?: BotActionChip[];
  timestamp: number;
}

// Starter Prompts tailored to active tab
export function getStarterPrompts(page: Page, environment: string): string[] {
  switch (page) {
    case 'skin':
      return [
        'Can I use Vitamin C with Salicylic Acid?',
        'What is my AM vs PM routine order?',
        'How do I introduce a retinoid safely?',
      ];
    case 'fitness':
      return [
        'I have knee pain today, change my workout',
        'Show me gentle seated mobility exercises',
        environment === 'pg'
          ? 'Show quiet, jump-free PG hostel exercises'
          : 'How to warm up joints before movement',
      ];
    case 'diet':
      return [
        'Give me a ₹50 PG high-protein snack',
        'Swap my dinner for a PG no-cook meal',
        'How much water should I drink today?',
      ];
    case 'blueprint':
      return [
        'Explain my daily calorie & macro split',
        'How does my sleep window affect recovery?',
        'Switch my kitchen to PG Mode',
      ];
    case 'gear':
      return [
        'Which essentials fit my monthly budget?',
        'Compare top-reviewed mineral sunscreens',
        'Is a foam roller worth pinning for recovery?',
      ];
    case 'family':
      return [
        'Show gentle elder mobility routines',
        'How to set elder medication check-ins',
        'Switch active family care profile',
      ];
    case 'settings':
      return [
        'How do I backup my health data?',
        'How do I enable hydration reminders?',
        'Switch theme to High-Contrast Elder Mode',
      ];
    case 'ergonomics':
      return [
        'Start my 20-20-20 screen break timer',
        'Show me 2-minute tech-neck desk exercises',
        'How do I fix my laptop ergonomics in a PG?',
      ];
    case 'dashboard':
    default:
      return [
        'I have knee pain today, change my workout',
        'Give me a ₹50 PG high-protein snack',
        'Can I use Vitamin C with Salicylic Acid?',
      ];
  }
}

export function processBotQuery(
  rawQuery: string,
  _navigate?: (page: Page, target?: string) => void,
): { text: string; actions?: BotActionChip[] } {
  const query = rawQuery.toLowerCase().trim();
  const workspace = useWorkspace.getState();
  const today = localDate();

  // 1. Knee Pain / Joint Modifications
  if (/knee|squat|lunge|joint pain|knee hurt/.test(query)) {
    return {
      text: 'Pause any deep squats or lunges that hurt immediately. For knee pain, switch to chair-supported sit-to-stands or seated mobility with zero added load. Keep knees tracking over toes without caving in. Stop if pain increases. Seek clinical care if the knee is swollen, locked, or cannot bear weight.',
      actions: [
        {
          id: 'knee-mobility',
          label: '🏃 Open Seated Mobility',
          run: nav => {
            nav('fitness', 'family-mobility');
            return 'Opened gentle seated mobility guides!';
          },
        },
        {
          id: 'knee-rest',
          label: '🧘 Mark Today as Rest Day',
          run: () => {
            workspace.toggleEasyDay(today);
            return 'Marked today as an Easy / Rest Day in your plan!';
          },
        },
        {
          id: 'knee-nhs',
          label: '📖 NHS Knee Pain Guide ↗',
          run: () => {
            window.open('https://www.nhs.uk/symptoms/knee-pain/', '_blank', 'noreferrer');
            return 'Opened clinical NHS knee guide in new tab.';
          },
        },
      ],
    };
  }

  // 2. High-Protein Budget Snacks (e.g. ₹50 PG Snack)
  if (/50.*snack|protein.*snack|high protein|pg snack|budget snack|quick snack/.test(query)) {
    const activeProfile = workspace.profile ?? createProfile(workspace);
    const pgProfile = { ...activeProfile, environment: 'pg' } as const;
    const choices = personalizedMealPlan(pgProfile, workspace.planIndex, {}, null, workspace.careMealFilters, { cuisine: workspace.defaultCuisine, weather: workspace.weatherSeason }).groups.Snack.choices;
    const suggestions = choices.filter(meal => meal.amount <= 50).sort((a, b) => b.macros.protein - a.macros.protein).slice(0, 3);
    const list = suggestions.map(meal => `${meal.name} · about ${Math.round(meal.macros.protein)} g protein · est. ${price(meal.amount, workspace.currency, true)}\n${meal.method}`);
    return {
      text: list.length ? `Here are no-cook snack estimates for your active diet and exclusions.\n\n${list.join('\n\n')}` : 'I could not find a snack at that price for your current profile. Open your meal plan to see matching serving options.',
      actions: [
        {
          id: 'snack-diet',
          label: '🥗 Open Diet & Recipes',
          run: nav => {
            nav('diet', 'Snack');
            return 'Opened the snack plan.';
          },
        },
      ],
    };
  }

  // 3. Skincare Conflicts (Vitamin C + Salicylic Acid)
  if (/vitamin c.*salicylic|salicylic.*vitamin c|ingredient conflict|can i use.*together|retinol.*acid/.test(query)) {
    return {
      text: 'Dermatologist rule: Do NOT layer Vitamin C (L-Ascorbic Acid) and Salicylic Acid (BHA) at the exact same time. Both are acidic actives—using them together can disrupt your skin barrier, causing redness, irritation, or peeling.\n\nOptimal Regimen:\n• AM: Vitamin C on dry skin, followed by moisturizer & broad-spectrum SPF.\n• PM: Salicylic Acid cleanser or serum, followed by barrier recovery moisturizer.',
      actions: [
        {
          id: 'skin-studio',
          label: '🧴 Open Skincare Studio',
          run: nav => {
            nav('skin', 'am-pm');
            return 'Opened Skincare Studio routine builder!';
          },
        },
        {
          id: 'skin-barrier',
          label: '🛡️ Check Barrier Guide',
          run: nav => {
            nav('skin', 'actives');
            return 'Opened ingredient safety guardrails!';
          },
        },
      ],
    };
  }

  // 4. One-Click Mode Switching: PG vs Home
  if (/switch to pg|pg mode|hostel mode/.test(query)) {
    workspace.setEnvironment('pg');
    return {
      text: 'Switched your active workspace to PG / Hostel Mode! Your meal plans now prioritize kettle cooking and ready-to-eat pantry staples, while your workouts switch to quiet, jump-free sessions.',
      actions: [
        {
          id: 'open-pg-diet',
          label: '🍲 View PG Meals',
          run: nav => {
            nav('diet');
            return 'Showing PG meal plans!';
          },
        },
      ],
    };
  }

  if (/switch to home|home mode|home kitchen/.test(query)) {
    workspace.setEnvironment('home');
    return {
      text: 'Switched your workspace to Home Kitchen Mode! Full stovetop, pressure cooker, and oven recipes are now unlocked.',
      actions: [
        {
          id: 'open-home-diet',
          label: '🍳 View Home Recipes',
          run: nav => {
            nav('diet');
            return 'Showing home cooking recipes!';
          },
        },
      ],
    };
  }

  // 5. One-Click Hydration Logging
  if (/\b(?:water|hydration)\b|\+250/.test(query)) {
    const total = workspace.days[today]?.water ?? 0;
    const base = workspace.profile && calculateProfile(workspace.profile)?.hydrationMl;
    const target = base ? base + climateHydrationBonus(base, workspace.profile, workspace.weatherSeason) : null;
    const canLog = /\b(?:log|add|drank)\b|\+250/.test(query);
    return {
      text: `${total.toLocaleString('en-IN')} ml logged today. ${target ? `Your planner estimate is ${target.toLocaleString('en-IN')} ml. Follow any fluid guidance from your care team.` : 'Use your care plan for a fluid target if you have one.'}`,
      actions: [
        ...(canLog ? [{
          id: 'add-more-water',
          label: 'Log 250 ml',
          run: () => {
            const current = useWorkspace.getState();
            if (current.activeMemberId !== workspace.activeMemberId) return 'Open hydration for the current profile to log water.';
            current.addWater(250);
            return 'Logged 250 ml of water.';
          },
        }] : []),
        {
          id: 'view-hydration',
          label: '📊 Hydration Tracker',
          run: nav => {
            nav('dashboard');
            return 'Opened the overview and daily hydration tracker.';
          },
        },
      ],
    };
  }

  // 6. One-Click Weather Shield Activation
  if (/winter shield|cold weather|chapped skin/.test(query)) {
    useWorkspace.setState({ weatherSeason: 'winter' });
    return {
      text: 'Activated Winter Weather Shield! Skincare routines now boost ceramides and rich occlusives, while nutrition increases warm soups and thermogenic spices.',
      actions: [
        {
          id: 'view-shield',
          label: '❄️ Review Winter Routine',
          run: nav => {
            nav('skin');
            return 'Displaying winter barrier defense routine!';
          },
        },
      ],
    };
  }

  if (/summer shield|heat|hot weather|sun protection/.test(query)) {
    useWorkspace.setState({ weatherSeason: 'summer' });
    return {
      text: 'Activated Summer Sun & Humidity Shield! Prioritizing lightweight gel hydration, double SPF protection, and electrolyte-rich meals.',
      actions: [
        {
          id: 'view-summer',
          label: '☀️ Review Summer Defense',
          run: nav => {
            nav('skin');
            return 'Displaying summer SPF defense!';
          },
        },
      ],
    };
  }

  // 7. PG Dinner Swap
  if (/dinner|swap dinner|no.cook dinner/.test(query)) {
    const reply = answerPip(query, workspace, today);
    const action = reply.action;
    return {
      text: reply.dinnerChoices ? reply.text.replace(/^Dinner swapped to /, 'Suggested dinner swap: ') : reply.text,
      actions: [
        ...(reply.dinnerChoices ? [{
          id: 'swap-dinner-action',
          label: 'Swap this dinner',
          run: (nav: (page: Page, target?: string) => void) => {
            const current = useWorkspace.getState();
            const confirmed = answerPip(query, current, localDate());
            if (current.activeMemberId !== workspace.activeMemberId || !confirmed.dinnerChoices || confirmed.text !== reply.text) {
              return 'The meal context changed. Ask for a new dinner suggestion.';
            }
            current.swapMeal('Dinner', confirmed.dinnerChoices);
            nav('diet', 'Dinner');
            return confirmed.text;
          },
        }] : []),
        ...(action ? [{
          id: 'view-diet',
          label: action.label,
          run: (nav: (page: Page, target?: string) => void) => {
            nav(action.page, action.target);
            return 'Opened the meal planner.';
          },
        }] : []),
      ],
    };
  }

  // 8. Desk, Posture & Eye Care (20-20-20 & Ergonomics)
  if (/eye|vision|20-20-20|blink|screen fatigue|dry eye|screen strain|ciliary|glare/.test(query)) {
    return {
      text: '20-20-20 Vision Protocol: Every 20 minutes of screen work, look at an object 20 feet away for at least 20 seconds. This releases tension in your ciliary focusing muscles. Remember to consciously blink (computer use drops blink rate by 66%, drying your tear-film).',
      actions: [
        {
          id: 'start-eye-timer',
          label: '👁️ Start 20-20-20 Eye Timer',
          run: nav => {
            nav('ergonomics', 'timer');
            return 'Started 20-20-20 screen break timer!';
          },
        },
        {
          id: 'eye-exercises',
          label: '✨ Follow Eye Tracking Guide',
          run: nav => {
            nav('ergonomics', 'eye-exercises');
            return 'Opened 60-second animated eye tracking guides.';
          },
        },
      ],
    };
  }

  if (/neck|tech neck|posture|ergonomic|desk|hunch|slouch|chin tuck|rounded shoulder|spine/.test(query)) {
    return {
      text: 'Forward head tilt can place up to 27kg of strain on your cervical spine. Immediate desk reset: 1. Chin Tucks (retract head straight back into neutral), 2. Seated Thoracic Extensions, 3. Scapular Wall Angels / shoulder blade pinches.',
      actions: [
        {
          id: 'neck-reset',
          label: '🧘 2-Min Tech-Neck Reset',
          run: nav => {
            nav('ergonomics', 'desk-exercises');
            return 'Displaying chair-friendly desk posture exercises!';
          },
        },
        {
          id: 'audit-posture',
          label: '🪑 Audit My Desk Posture',
          run: nav => {
            nav('ergonomics', 'audit');
            return 'Opening 30-Second Desk Ergonomics Audit!';
          },
        },
      ],
    };
  }

  // 9. Settings & Preferences
  if (/settings|backup|export|theme|elder mode|reminders/.test(query)) {
    return {
      text: 'You can adjust your theme, notifications, living defaults, and export local data anytime in Settings.',
      actions: [
        {
          id: 'open-settings-action',
          label: '⚙️ Open Settings',
          run: nav => {
            nav('settings');
            return 'Opened Settings view!';
          },
        },
      ],
    };
  }

  // 9. Tech Stack
  if (/stack|tech|built with|framework|dependencies|how does it work/.test(query)) {
    return {
      text: 'AURA-CARE is built with React 19, TypeScript, and Vite, with Zustand for offline-first local state. The avatar and biometric tools use zero-dependency native SVG and Canvas. Ambient sound is synthesized in real time via the native Web Audio API with zero external audio files.',
      actions: [
        {
          id: 'view-blueprint',
          label: '📋 View Architecture',
          run: nav => {
            nav('blueprint');
            return 'Showing architecture plan.';
          },
        },
      ],
    };
  }

  // 10. General Fallback
  return {
    text: `I'm synced to your active ${environments[workspace.environment].label} setup (${workspace.budget} budget, ${workspace.weatherSeason} shield). Ask me to modify exercises for pain, suggest a ₹50 PG snack, check skincare ingredients, or tap any shortcut below!`,
    actions: [
      {
        id: 'fallback-knee',
        label: '🦵 Knee Pain Help',
        run: nav => {
          nav('fitness');
          return 'Showing gentle mobility exercises.';
        },
      },
      {
        id: 'fallback-water',
        label: '💧 Log +250ml Water',
        run: () => {
          workspace.addWater(250);
          return 'Added +250ml water!';
        },
      },
      {
        id: 'fallback-pg',
        label: '⚡ Switch to PG Mode',
        run: () => {
          workspace.setEnvironment('pg');
          return 'Switched kitchen to PG Mode!';
        },
      },
    ],
  };
}

import { budgets, environments, type Budget, type Currency, type Environment, type Preference, type SkinType } from '../context';
import type { UserBioProfile } from '../profile';
import type { WeatherSeason } from '../store';
import { climateProtocols } from '../components/WeatherProtectionShield';

export interface CoachContext {
  environment: Environment;
  budget: Budget;
  currency: Currency;
  diet: Preference;
  skin: SkinType;
  weatherSeason: WeatherSeason;
  profile: UserBioProfile | null;
  activeMemberName?: string;
  isSenior?: boolean;
}

export interface CoachResponse {
  answer: string;
  category: 'nutrition' | 'fitness' | 'skincare' | 'climate' | 'elder_care' | 'general';
  actionSteps: string[];
  clinicalNote?: string;
  source: 'local_rule_engine' | 'llm_api';
}

export interface QuickPromptChip { id: string; label: string; prompt: string; badge?: string }

const seasonalChips: Record<WeatherSeason, QuickPromptChip> = {
  summer: { id: 'summer', label: 'Summer sun', prompt: 'What does the summer weather shield change?' },
  winter: { id: 'winter', label: 'Winter care', prompt: 'What changes in winter?' },
  pollution: { id: 'smog', label: 'Dust and smog', prompt: 'How does the pollution shield work?' },
  monsoon: { id: 'monsoon', label: 'Monsoon care', prompt: 'Where are my monsoon routine suggestions?' },
};

export function getQuickPromptChips(context: CoachContext): QuickPromptChip[] {
  return [
    context.environment === 'pg'
      ? { id: 'pg-meal', label: 'PG dinner ideas', prompt: 'How can I plan a no-cook dinner in a PG?' }
      : { id: 'budget-protein', label: 'Budget protein', prompt: 'What are affordable protein staples for my diet?' },
    seasonalChips[context.weatherSeason],
    { id: 'knee', label: 'Squat comfort', prompt: 'What should I do if squats hurt my knees?' },
    { id: 'actives', label: 'Skincare actives', prompt: 'How can I check for a retinol and salicylic acid conflict?' },
    context.isSenior
      ? { id: 'elder-care', label: 'Senior care', prompt: 'Where can I track my parent’s walks and care reminders?' }
      : { id: 'quiet', label: 'Quiet movement', prompt: 'Where can I find a quiet workout?' },
  ];
}

export function generateCoachAnswer(query: string, context: CoachContext): CoachResponse {
  const question = query.toLowerCase();
  const protocol = climateProtocols[context.weatherSeason];
  const answer = (category: CoachResponse['category'], text: string, actionSteps: string[], clinicalNote?: string): CoachResponse => ({
    category, answer: text, actionSteps, clinicalNote, source: 'local_rule_engine',
  });

  if (/knee|patella|squat/.test(question)) return answer('fitness',
    'Pause a squat or lunge that hurts. For everyday movement, use a stable support and a comfortable range after symptoms settle.',
    ['Try a seated or supported session in Movement Hub.', 'A physiotherapist can help you find a modification if pain persists.'],
    'Get urgent medical advice if the knee is badly swollen, misshapen, locks, gives way, or cannot take weight.');

  if (/back pain|lumbar|spine|deadlift/.test(question)) return answer('fitness',
    'Skip loaded movements that make your symptoms worse. A qualified clinician can assess persistent pain and guide your return to lifting.',
    ['Use the hinge demonstration to review the movement after you can practise comfortably.', 'Choose a gentle session that fits your ability.']);

  if (/hard.water|borewell|tanker|hair fall/.test(question)) return answer('skincare',
    'Open the hair and scalp section for a wash routine that fits your setup. Keep it gentle when your scalp is irritated.',
    ['Rinse out shampoo thoroughly and follow its label.', 'Look for a mild shampoo. Ask a clinician about persistent itching, scaling or hair loss.']);

  if (/retinol|salicylic|niacinamide|exfolia|active|\baha\b|\bbha\b|clash/.test(question)) return answer('skincare',
    'Retinoids and exfoliating acids can irritate when layered together. Use the active schedule in Skincare Studio to check for overlaps.',
    ['Follow the product or prescription instructions.', 'Introduce one optional active at a time and pause it if it irritates.'],
    'Check with your clinician before starting or changing prescribed skincare.');

  if (/\bpg\b|hostel|kettle|no.cook|dinner|\bmeal\b/.test(question)) return answer('nutrition',
    `Open the Regional Recipe Library and filter by kitchen equipment. Your active food preference is ${context.diet}.`,
    ['Use ingredients explicitly labeled ready to eat or get fully cooked components from the mess.', 'Use a clean water source, keep perishables chilled until serving, and check packaged or shared-kitchen ingredients for your exclusions.'],
    'Choose fully cooked sprouts and pulses. Soaking them in kettle water does not cook them safely.');

  if (/sun\b|spf|weather|summer|winter|monsoon|pollution|smog/.test(question)) return answer('climate',
    `Your active shield is ${protocol.name}. Its dashboard panel brings together skincare, movement and food suggestions.`,
    ['Choose the setting that matches your actual conditions.', 'Follow any fluid and sodium limits set by your care team.']);

  if (/elder|parent|senior|mom|dad|aging|nocturia|reminder/.test(question)) return answer('elder_care',
    'Family & Elder Care has a checklist for the active member’s water, movement, comfort and medication reminders.',
    ['Switch to the appropriate person in Family Circle before logging.', 'Choose gentle movement and rise slowly with a stable support if balance is difficult.'],
    'Use reminders for an existing care schedule. Ask the care team about any change to medication or fluid routines.');

  if (/silent|jump|apartment|roommate|workout|movement|exercise/.test(question)) return answer('fitness',
    'Movement Hub includes quiet, seated and supported options. Start with a comfortable pace.',
    ['Choose the PG / Hostel setting for quiet room workouts.', 'Use a stable surface and stop any movement that causes pain or dizziness.']);

  if (/protein|vegetarian|vegan|cheap|budget/.test(question)) return answer('nutrition',
    `Your active food preference is ${context.diet}, and your budget is ${budgets[context.budget].short}. Lentils, chickpeas and roasted chana can be affordable pantry options.`,
    ['Use the recipe library filters to find preparations you can make.', 'Compare food labels per serving and check any allergies or exclusions.']);

  return answer('general', `Your current workspace is set to ${environments[context.environment].label} with ${budgets[context.budget].short}.`,
    ['Ask about meal prep, quiet movement, skincare timing, the climate shield, or family care.', 'Use Overview to check off your daily tasks.']);
}

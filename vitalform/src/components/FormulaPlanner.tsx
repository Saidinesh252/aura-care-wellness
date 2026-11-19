import { Beaker, CalendarDays, Check, CircleAlert, Plus, ShieldCheck, Split, X } from 'lucide-react';
import { useState } from 'react';
import { activeLabels, formulaConflicts, potentFormula, skinTimingLabels, splitFormulas, type Active, type SkinTiming } from '../formulas';
import { safetyFor, shiftDate } from '../safety';
import { formulaHold, scheduledFormulas } from '../skinSchedule';
import { useWorkspace } from '../store';
import { EvidenceInfo } from './Evidence';
import { MistakeGuardrailBanner, presetGuardrails } from './MistakeGuardrailBanner';
import { SelectField } from './Shared';

const timingOptions = Object.entries(skinTimingLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>);

export function FormulaPlanner({ today }: { today: string }) {
  const { profile, skin, easyDay, pinnedProducts, ownSkincare, skinSchedule, skinRamps, rampChecks, updateSkinSchedule, addSkinEntry, removeSkinEntry, saveRampCheck } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState('');
  const items = scheduledFormulas(pinnedProducts, ownSkincare, skinSchedule);
  const sensitive = skin === 'Sensitive' || safetyFor(profile, today).gentleSkin;
  const conflicts = formulaConflicts(items, sensitive);
  return <section className="formula-planner card" id="active-schedule" aria-labelledby="formulas-title">
    <div className="section-head"><div><h2 id="formulas-title"><Beaker size={19} /> Active schedule</h2><p>Review the timing of pinned products or add a product you already own.</p></div>
      <button className="button secondary" aria-expanded={adding} onClick={() => setAdding(!adding)}>{adding ? <X size={15} /> : <Plus size={15} />} {adding ? 'Close' : 'Add my product'}</button></div>
    {adding && <form className="formula-form" onSubmit={event => {
      event.preventDefault();
      const fields = new FormData(event.currentTarget);
      const name = String(fields.get('name')).trim();
      const active = fields.get('active') as Active;
      const timing = fields.get('timing') as SkinTiming;
      if (!name) return;
      addSkinEntry({ id: `own-${crypto.randomUUID()}`, name, active, timing }, potentFormula([active]));
      setAdding(false);
    }}>
      <label className="form-field"><span>Product name</span><input name="name" required maxLength={100} /></label>
      <label className="form-field"><span>Main active</span><SelectField name="active">{Object.entries(activeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</SelectField></label>
      <label className="form-field"><span>Timing</span><SelectField name="timing" defaultValue="pm">{timingOptions}</SelectField></label>
      <button type="submit" className="button primary">Add to schedule</button>
    </form>}
    {conflicts.length > 0 && <div className="formula-warning" role="status"><CircleAlert size={21} /><div><h3>Formula conflict warning</h3>
      {conflicts.map(({ first, second, reason, times }) => <p key={`${first.id}-${second.id}`}><strong>{first.name} + {second.name} · {times.join(' / ').toUpperCase()}</strong> {reason}</p>)}
      <p className="fine-print">Use the split to review your plan. Follow your prescriber’s directions and product labels. {conflicts.some(pair => pair.kind === 'retinoid-acid') && <a href="https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/022502s008lbl.pdf" target="_blank" rel="noreferrer">FDA adapalene label</a>}</p>
      <button className="button secondary" onClick={() => {
        const next = splitFormulas(items, sensitive);
        updateSkinSchedule(next);
        setStatus(items.some(item => item.timing !== 'paused' && next[item.id] === 'paused') ? 'Schedule updated. Review any paused products below.' : 'Schedule updated. Check each product’s directions before following the new timing.');
      }}><Split size={15} /> Auto-split AM / PM</button></div></div>}
    {status && <p className="fine-print" role="status">{status}</p>}
    {items.map(item => {
      const start = skinRamps[item.id];
      const phase = start && today >= start && today < shiftDate(start, 21);
      const patchUntil = start ? shiftDate(start, 10) : '';
      const lastCheck = rampChecks[item.id];
      const checkDue = phase && (!lastCheck ? today >= shiftDate(start, 7) : today >= shiftDate(lastCheck, 7));
      const hold = formulaHold(item, profile, today, easyDay === today, sensitive);
      const conflict = conflicts.some(pair => pair.first.id === item.id || pair.second.id === item.id);
      const phaseText = today < patchUntil
        ? `Patch test through ${shiftDate(patchUntil, -1)}. Follow the label and use a small test area.`
        : today < shiftDate(start ?? today, 15)
          ? `If tolerated, start with up to two nonconsecutive ${item.timing === 'am' ? 'mornings' : 'evenings'} this week if the label permits.`
          : 'If comfortable, continue at a tolerable frequency. Space out uses and stop if irritation returns.';
      return <article className="formula-entry" key={item.id}>
        <div className="formula-entry-head"><div><h3>{item.name}</h3><p>{item.actives.map(active => activeLabels[active]).join(' · ') || 'Check label for active ingredients'}</p></div>
          <SelectField aria-label={`Timing for ${item.name}`} value={item.timing} onChange={event => updateSkinSchedule({ [item.id]: event.target.value as SkinTiming })}>{timingOptions}</SelectField>
          {ownSkincare.some(entry => entry.id === item.id) && <button className="plain-icon" aria-label={`Remove ${item.name}`} onClick={() => removeSkinEntry(item.id)}><X size={17} /></button>}
        </div>
        {(hold || conflict) && <p className="formula-hold"><ShieldCheck size={15} /> {hold || 'Hold use until you resolve the timing conflict.'}</p>}
        <MistakeGuardrailBanner category="skin" title="What not to do" compact defaultExpanded={false} mistakes={presetGuardrails['skincare-treatment']} />
        {phase && <div className="ramp-entry"><span><CalendarDays size={16} /> 21-day introduction</span><p>{hold ? 'The safety pause takes priority over this schedule.' : phaseText}</p>
          <div className="ramp-actions">
            {checkDue && <button className="button secondary" onClick={() => saveRampCheck(item.id, today, false)}><Check size={14} /> Skin feels calm</button>}
            {!hold && <button className="button secondary" onClick={() => saveRampCheck(item.id, today, true)}>Report irritation</button>}
            <EvidenceInfo rule="patch" compact />
          </div>
          {lastCheck && <small>Last reaction check {lastCheck}</small>}
        </div>}
      </article>;
    })}
  </section>;
}

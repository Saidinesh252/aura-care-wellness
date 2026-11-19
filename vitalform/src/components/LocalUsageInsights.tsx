import {
  Award,
  Flame,
  LineChart,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useWorkspace } from '../store';
import { computeLocalAnalytics, type HabitStat } from '../analytics/localAnalytics';
import { localDate } from '../context';

export function LocalUsageInsights({ today = localDate() }: { today?: string }) {
  const { days, budget, currency, profileStarted } = useWorkspace();
  const analytics = computeLocalAnalytics(days, budget, currency, profileStarted, today);

  const isSaving = analytics.estimatedMonthlySavingsINR > 0;
  const isINR = currency === 'INR';

  return (
    <section className="dashboard-section" aria-label="Privacy-First Local Wellness Insights">
      <div className="section-head" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18 }}>
            <LineChart size={20} color="#10b981" /> Local Habit Insights &amp; Savings
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
            Calculated strictly in your browser memory. Zero analytics cookies or remote tracking.
          </p>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 9px',
            borderRadius: 20,
            background: 'var(--surface-tint)',
            border: '1px solid var(--border)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--green-dark)',
          }}
        >
          <ShieldCheck size={13} /> 100% Private
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* Card 1: Habit Completion Breakdown */}
        <div
          className="card"
          style={{
            padding: 16,
            borderRadius: 14,
            display: 'grid',
            gap: 12,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} color="#3b82f6" /> Habit Consistency Rates
            </strong>
            <small style={{ fontSize: 11, color: 'var(--muted)' }}>
              {analytics.totalDaysTracked} {analytics.totalDaysTracked === 1 ? 'day' : 'days'} logged
            </small>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {analytics.habits.map((h: HabitStat) => (
              <div key={h.id} style={{ display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{h.name}</span>
                  <span style={{ fontWeight: 700, color: h.percentage >= 70 ? 'var(--green-dark)' : 'var(--muted)' }}>
                    {h.percentage}% ({h.completedDays}/{h.totalDays})
                  </span>
                </div>
                {/* Progress Bar */}
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: 'var(--surface-tint)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${h.percentage}%`,
                      borderRadius: 999,
                      background:
                        h.percentage >= 80
                          ? '#10b981'
                          : h.percentage >= 50
                          ? '#3b82f6'
                          : '#f59e0b',
                      transition: 'width 0.4s ease-out',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Streaks & Smart Value Savings */}
        <div
          className="card"
          style={{
            padding: 16,
            borderRadius: 14,
            display: 'grid',
            gap: 12,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={16} color="#f59e0b" /> Momentum &amp; Savings
            </strong>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: 'var(--surface-tint)',
                color: 'var(--muted)',
              }}
            >
              {analytics.budgetLabel}
            </span>
          </div>

          {/* Streaks Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-tint)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>Active Streak</span>
              <strong style={{ fontSize: 18, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flame size={16} /> {analytics.currentStreak} Days
              </strong>
            </div>

            <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-tint)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>Best Historical</span>
              <strong style={{ fontSize: 18, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Award size={16} /> {analytics.bestStreak} Days
              </strong>
            </div>
          </div>

          {/* Savings Box */}
          {isSaving ? (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: 'color-mix(in srgb, #10b981 8%, var(--surface))',
                border: '1px dashed color-mix(in srgb, #10b981 40%, var(--border))',
                display: 'grid',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 750, color: 'var(--green-dark)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <PiggyBank size={15} /> Smart-Value Monthly Savings
                </span>
                <strong style={{ fontSize: 14, color: 'var(--green-dark)' }}>
                  {isINR ? `₹${analytics.estimatedMonthlySavingsINR.toLocaleString('en-IN')}` : `$${analytics.estimatedMonthlySavingsUSD}`}/mo
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.45 }}>
                Estimated savings vs. commercial luxury clinical coaching. Cumulative since start ({analytics.profileDaysActive}d):{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {isINR ? `₹${analytics.cumulativeSavingsINR.toLocaleString('en-IN')}` : `$${analytics.cumulativeSavingsUSD}`}
                </strong>.
              </p>
            </div>
          ) : (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--surface-tint)', fontSize: 11.5, color: 'var(--muted)' }}>
              ✨ Performance Tier Active: Maximum customized active formulations and biomechanical training splits.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

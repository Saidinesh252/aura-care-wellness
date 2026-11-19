import {
  Bot,
  Building2,
  CheckCircle2,
  House,
  Send,
  Sparkles,
  Sun,
  User,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../store';
import {
  getQuickPromptChips,
  type CoachContext,
  type CoachResponse,
  type QuickPromptChip,
} from '../coach/coachEngine';
import { queryAuraCoach } from '../coach/llmCoach';
import './auraCoach.css';

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  category?: string;
  actionSteps?: string[];
  clinicalNote?: string;
  source?: 'local_rule_engine' | 'llm_api';
  timestamp: string;
}

interface AuraCoachProps { open?: boolean; onClose?: () => void }

export function AuraCoachDrawer(props: AuraCoachProps = {}) {
  const profileId = useWorkspace(state => state.activeMemberId);
  return <AuraCoachSession key={profileId} {...props} />;
}

function AuraCoachSession({ open, onClose }: AuraCoachProps) {
  const {
    environment,
    budget,
    currency,
    diet,
    skin,
    weatherSeason,
    profile,
    familyMembers,
    activeMemberId,
  } = useWorkspace();

  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = open ?? localOpen;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const activeMember = familyMembers.find((m) => m.id === activeMemberId);
  const activeName = activeMember?.name || 'Me';
  const isSenior = Boolean((profile?.age && profile.age >= 60) || (activeMember?.age && activeMember.age >= 60));

  const coachContext: CoachContext = {
    environment,
    budget,
    currency,
    diet,
    skin,
    weatherSeason,
    profile,
    activeMemberName: activeName,
    isSenior,
  };

  const quickChips = getQuickPromptChips(coachContext);

  function closeCoach() {
    if (onClose) onClose();
    else setLocalOpen(false);
  }

  // Initialize welcome message upon first opening
  useEffect(() => {
    if (messages.length === 0) {
      const envText = environment === 'pg' ? '🏢 PG / Hostel setup (Electric kettle & silent workouts)' : '🏠 Home setup';
      const welcome: ChatMessage = {
        id: 'welcome',
        sender: 'coach',
        text: `Hello ${activeName}. Ask Aura about meals, movement, or skincare for your ${envText} and ${weatherSeason} climate shield.`,
        category: 'general',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'local_rule_engine',
      };
      setMessages([welcome]);
    }
  }, [environment, budget, weatherSeason, activeName]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) closeButton.current?.focus({ preventScroll: true });
  }, [isOpen]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response: CoachResponse = await queryAuraCoach(q, coachContext);

      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: response.answer,
        category: response.category,
        actionSteps: response.actionSteps,
        clinicalNote: response.clinicalNote,
        source: response.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `coach-fallback-${Date.now()}`,
        sender: 'coach',
        text: 'I could not process your query at this moment. Please check your connectivity or try one of the quick prompts below.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'local_rule_engine',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (chip: QuickPromptChip) => {
    handleSend(chip.prompt);
  };

  return (
    <>
      {/* Floating Trigger Button at bottom-right */}
      {open === undefined && <button
        type="button"
        className="aura-coach-trigger"
        onClick={() => setLocalOpen(true)}
        aria-label="Open Ask Aura Coach Assistant"
        title="Ask Aura Coach"
      >
        <span className="aura-trigger-icon">
          <Sparkles size={16} />
        </span>
        <span className="aura-trigger-text">Ask Aura Coach</span>
        <span className="aura-trigger-badge" />
      </button>}

      {/* Slide-over Drawer & Backdrop */}
      {isOpen && (
        <div className="aura-drawer-backdrop" onClick={closeCoach}>
          <aside
            className="aura-coach-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Aura Coach"
            onKeyDown={event => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                closeCoach();
              } else if (event.key === 'Tab') {
                const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]')];
                const first = focusable[0];
                const last = focusable.at(-1);
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            {/* Header */}
            <div className="aura-drawer-header">
              <div className="aura-drawer-header-left">
                <span className="aura-drawer-avatar">
                  <Bot size={22} />
                </span>
                <div>
                  <h3>
                    Aura Coach <Sparkles size={14} color="#10b981" />
                  </h3>
                  <small>
                    <span className="aura-engine-badge">
                      <Zap size={11} /> Local assistant
                    </span>
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeCoach}
                ref={closeButton}
                aria-label="Close Aura Coach"
              >
                <X size={18} />
              </button>
            </div>

            {/* Context Pills Strip */}
            <div className="aura-context-pills-strip" aria-label="Active Context Signals">
              <span className="aura-context-mini-chip">
                <User size={11} /> {activeName}
              </span>
              <span className="aura-context-mini-chip">
                {environment === 'pg' ? <Building2 size={11} /> : <House size={11} />}
                {environment === 'pg' ? 'PG Mode' : 'Home'}
              </span>
              <span className="aura-context-mini-chip">
                <Wallet size={11} /> {budget}
              </span>
              <span className="aura-context-mini-chip">
                <Sun size={11} /> {weatherSeason}
              </span>
            </div>

            {/* Messages Thread */}
            <div className="aura-chat-thread">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={msg.sender === 'user' ? 'aura-msg-user' : 'aura-msg-coach'}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                  {/* Action Steps Card */}
                  {msg.actionSteps && msg.actionSteps.length > 0 && (
                    <div className="aura-action-steps-box">
                      <span className="aura-action-steps-title">
                        <CheckCircle2 size={13} /> Actionable Steps:
                      </span>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {msg.actionSteps.map((step, idx) => (
                          <li key={idx} style={{ fontSize: 11.5, marginTop: 3 }}>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Clinical Footnote */}
                  {msg.clinicalNote && (
                    <div className="aura-clinical-footnote">
                      ℹ️ {msg.clinicalNote}
                    </div>
                  )}

                  <span
                    style={{
                      fontSize: 9.5,
                      color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--muted)',
                      alignSelf: 'flex-end',
                      display: 'block',
                      textAlign: 'right',
                    }}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="aura-msg-coach" style={{ fontStyle: 'italic', color: 'var(--muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} className="spinning" />
                    <span>Analyzing your active bio-profile &amp; climate shield...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="aura-quick-chips-wrapper">
              <span className="aura-chips-label">Quick Suggestions for your Mode:</span>
              <div className="aura-quick-chips-carousel">
                {quickChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className="aura-prompt-chip"
                    onClick={() => handleChipClick(chip)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              className="aura-drawer-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                aria-label="Ask Aura Coach"
                maxLength={350}
                placeholder="Ask about PG food swaps, knee pain, clashing serums..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="aura-input-field"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="aura-send-btn"
                disabled={isLoading || !inputQuery.trim()}
                aria-label="Send message to Aura Coach"
              >
                <Send size={16} />
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}

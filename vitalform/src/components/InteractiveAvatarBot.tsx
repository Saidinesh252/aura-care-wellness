import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  Mic,
  MicOff,
  Minimize2,
  Volume2,
  VolumeX,
  Volume1,
  Sparkles,
  X,
} from 'lucide-react';
import { budgets, environments, localDate, type Page } from '../context';
import { useWorkspace } from '../store';
import { playSynthBlip } from '../ProceduralSynth';
import {
  AvatarRenderer,
  type AvatarExpression,
  type AvatarStyle,
} from './AvatarRenderer';
import {
  getStarterPrompts,
  processBotQuery,
  type BotActionChip,
  type BotMessage,
} from './BotActionEngine';
import './avatarBot.css';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page, target?: string) => void;
  synthEnabled?: boolean;
  onToggleSynth?: () => void;
  onOpenPip?: () => void;
  onOpenCoach?: () => void;
}

export function InteractiveAvatarBot({
  currentPage,
  onNavigate,
  synthEnabled = false,
  onToggleSynth,
  onOpenPip,
  onOpenCoach: _onOpenCoach,
}: Props) {
  const environment = useWorkspace(state => state.environment);
  const budget = useWorkspace(state => state.budget);
  const activeMemberId = useWorkspace(state => state.activeMemberId);
  const memberName =
    useWorkspace(state => state.familyMembers.find(m => m.id === activeMemberId)?.name) ?? 'My Profile';

  // UI state
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<AvatarStyle>('bot');
  const [expression, setExpression] = useState<AvatarExpression>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [voiceReadAloud, setVoiceReadAloud] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [unreadTip, setUnreadTip] = useState<string | null>(
    'Hi! I can modify workouts for knee pain, suggest PG snacks, or adapt your shield.',
  );

  // Chat conversation history with 1-Click Action Chips
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hello! I'm AURA-BOT, your expressive AI bio-companion. I'm calibrated to your ${environments[environment].label} (${budgets[budget].short}). Ask me questions or tap any 1-click action below to execute live updates:`,
      actions: [
        {
          id: 'action-knee',
          label: '🦵 Modify workouts for knee pain',
          run: nav => {
            useWorkspace.getState().toggleEasyDay(localDate());
            nav('fitness', 'family-mobility');
            return 'Modified active workout: Paused deep knee squats, switched to seated joint mobility, and marked today for joint recovery!';
          },
        },
        {
          id: 'action-snack',
          label: '🥜 Suggest ₹50 PG snack',
          run: nav => {
            nav('diet', 'snacks');
            return 'Top ₹50 PG high-protein snacks: 1. Roasted Chana with cucumber & lemon (~18g protein for ₹25), 2. Dahi cup with crushed peanuts (~14g protein for ₹30), 3. Sprouted Moong Chaat (~15g protein for ₹20)!';
          },
        },
        {
          id: 'action-home',
          label: '🏡 Switch to Home Mode',
          run: nav => {
            useWorkspace.getState().setEnvironment('home');
            nav('diet');
            return 'Switched kitchen to Home Mode! Stovetop recipes, meal planning, and full home movement circuits are now active.';
          },
        },
        {
          id: 'action-water',
          label: '💧 Log +250ml Water',
          run: () => {
            useWorkspace.getState().addWater(250);
            return 'Logged +250ml water! Hydration status and cellular metabolism updated.';
          },
        },
        {
          id: 'action-eye-timer',
          label: '👁️ Start 20-20-20 Eye Timer',
          run: nav => {
            nav('ergonomics', 'timer');
            return 'Opened 20-20-20 Eye Relief Studio!';
          },
        },
        {
          id: 'action-tech-neck',
          label: '🧘 2-Min Tech-Neck Reset',
          run: nav => {
            nav('ergonomics', 'desk-exercises');
            return 'Opened chair-friendly tech-neck & spine posture fixes!';
          },
        },
        {
          id: 'action-audit-desk',
          label: '🪑 Audit My Desk Posture',
          run: nav => {
            nav('ergonomics', 'audit');
            return 'Opened 30-Second Desk Ergonomics Audit!';
          },
        },
      ],
      timestamp: Date.now(),
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);
  const headingId = useId();

  // Mouse pupil tracking
  useEffect(() => {
    function handlePointer(e: PointerEvent) {
      setPointerPos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener('pointermove', handlePointer, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointer);
  }, []);

  // Scroll transcript to bottom on new messages
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, expression]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus({ preventScroll: true });
      setUnreadTip(null);
    }
  }, [open]);

  // Trigger celebration animation
  function triggerCelebration() {
    setExpression('celebrating');
    playSynthBlip();
    window.setTimeout(() => setExpression('idle'), 1800);
  }

  // Voice Speech Synthesis
  function speakText(text: string) {
    if (!voiceReadAloud || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[•\n]+/g, '. ').slice(0, 220);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = style === 'pip' ? 1.3 : 1.0;

    utterance.onstart = () => {
      setExpression('speaking');
      setAudioLevel(0.85);
    };
    utterance.onend = () => {
      setExpression('idle');
      setAudioLevel(0);
    };
    utterance.onerror = () => {
      setExpression('idle');
      setAudioLevel(0);
    };

    window.speechSynthesis.speak(utterance);
  }

  // Web Speech Recognition (Mic Input)
  function toggleMic() {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser. You can type your question!');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      setExpression('idle');
      return;
    }

    try {
      const recognition = new SpeechRec();
      speechRecognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setExpression('listening');
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputVal(transcript);
          handleSendQuery(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setExpression('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        setExpression('idle');
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setExpression('idle');
    }
  }

  // Query processing & action generation
  function handleSendQuery(textToSend: string) {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    setInputVal('');
    const userMsg: BotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setExpression('thinking');

    // Simulate natural thinking delay
    window.setTimeout(() => {
      const reply = processBotQuery(trimmed, onNavigate);
      const botMsg: BotMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply.text,
        actions: reply.actions,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMsg]);
      setExpression('speaking');
      setAudioLevel(0.75);

      if (synthEnabled) playSynthBlip();
      speakText(reply.text);

      window.setTimeout(() => {
        if (!window.speechSynthesis?.speaking) {
          setExpression('idle');
          setAudioLevel(0);
        }
      }, 1400);
    }, 450);
  }

  function handleActionClick(action: BotActionChip) {
    playSynthBlip();
    triggerCelebration();
    const confirmation = action.run(onNavigate);

    const botConfirmMsg: BotMessage = {
      id: `bot-confirm-${Date.now()}`,
      sender: 'bot',
      text: `✨ ${confirmation}`,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, botConfirmMsg]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleSendQuery(inputVal);
  }

  const starters = getStarterPrompts(currentPage, environment);

  return (
    <div
      className="avatar-bot-dock"
      onKeyDown={e => {
        if (open && e.key === 'Escape') setOpen(false);
      }}
    >
      {/* Liquid Glass Chat Popover / Drawer */}
      {open && (
        <section
          className="avatar-chat-drawer"
          role="dialog"
          aria-labelledby={headingId}
          aria-modal="true"
        >
          {/* Header */}
          <header className="avatar-chat-head">
            <div className="avatar-chat-head-left">
              <AvatarRenderer
                style={style}
                expression={expression}
                size={42}
                pointerPos={pointerPos}
                audioLevel={audioLevel}
                isHovered={isHovered}
              />
              <div className="avatar-chat-head-titles">
                <h2 id={headingId}>{style === 'pip' ? 'PIP.EXE' : 'AURA-BOT'}</h2>
                <span className="avatar-status-pill">
                  <span className="avatar-live-dot" />
                  {environments[environment].short} • {budgets[budget].short}
                </span>
              </div>
            </div>

            <div className="avatar-chat-head-actions">
              {/* Audio Synth Toggle */}
              {onToggleSynth && (
                <button
                  type="button"
                  className="avatar-tool-btn"
                  data-active={synthEnabled}
                  onClick={onToggleSynth}
                  title={synthEnabled ? 'Mute Procedural Synth' : 'Play Ambient Synth'}
                  aria-label={synthEnabled ? 'Mute Synth' : 'Play Synth'}
                >
                  {synthEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              )}

              {/* Voice Read-Aloud Toggle */}
              <button
                type="button"
                className="avatar-tool-btn"
                data-active={voiceReadAloud}
                onClick={() => setVoiceReadAloud(!voiceReadAloud)}
                title={voiceReadAloud ? 'Mute speech output' : 'Enable voice read-aloud'}
                aria-label={voiceReadAloud ? 'Voice read-aloud on' : 'Voice read-aloud off'}
              >
                <Volume1 size={16} />
              </button>

              {/* Minimize / Close */}
              <button
                type="button"
                className="avatar-tool-btn"
                onClick={() => setOpen(false)}
                aria-label="Minimize companion"
                title="Minimize companion"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </header>

          {/* Style Switcher Bar */}
          <div className="avatar-style-bar">
            <div className="avatar-style-pills" role="radiogroup" aria-label="Avatar Style">
              <button
                type="button"
                className="avatar-style-pill"
                aria-pressed={style === 'bot'}
                onClick={() => setStyle('bot')}
              >
                Bot
              </button>
              <button
                type="button"
                className="avatar-style-pill"
                aria-pressed={style === 'pip'}
                onClick={() => {
                  if (onOpenPip) onOpenPip();
                  else setStyle('pip');
                }}
              >
                8-Bit Pip
              </button>
              <button
                type="button"
                className="avatar-style-pill"
                aria-pressed={style === 'halo'}
                onClick={() => setStyle('halo')}
              >
                Bio-Halo
              </button>
            </div>
            <span className="text-xs text-slate-400 font-mono">Anchored Studio</span>
          </div>

          {/* Chat Transcript with Interactive Action Chips */}
          <div className="avatar-chat-transcript" ref={transcriptRef} tabIndex={0} aria-label="Chat messages">
            {messages.map(msg => (
              <div key={msg.id} className={`avatar-msg avatar-msg-${msg.sender}`}>
                <div className="avatar-msg-bubble">{msg.text}</div>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="avatar-msg-actions">
                    {msg.actions.map(action => (
                      <button
                        type="button"
                        key={action.id}
                        className="avatar-action-chip"
                        onClick={() => handleActionClick(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contextual Smart Starter Prompts per Page */}
          <div className="avatar-starters-bar" aria-label="Quick question prompts">
            {starters.map((prompt, i) => (
              <button
                type="button"
                key={i}
                className="avatar-starter-pill"
                onClick={() => handleSendQuery(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input with Speech Mic Button */}
          <form className="avatar-chat-form" onSubmit={handleSubmit}>
            <button
              type="button"
              className="avatar-mic-btn"
              data-listening={isListening}
              onClick={toggleMic}
              aria-label={isListening ? 'Stop listening' : 'Start voice speech recognition'}
              title={isListening ? 'Listening… click to stop' : 'Click to speak hands-free'}
            >
              {isListening ? <Mic size={17} /> : <MicOff size={17} />}
            </button>

            <input
              ref={inputRef}
              className="avatar-chat-input"
              required
              placeholder="Ask AURA (e.g. knee pain, PG snacks, actives)…"
              autoComplete="off"
              spellCheck="true"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
            />

            <button
              type="submit"
              className="avatar-send-btn"
              disabled={!inputVal.trim()}
              aria-label="Send message"
            >
              ↵
            </button>
          </form>
        </section>
      )}

      {/* Floating Avatar Trigger Dock Badge */}
      <div style={{ position: 'relative' }}>
        {unreadTip && !open && (
          <div className="avatar-unread-tip" role="status">
            <div
              className="avatar-unread-tip-text"
              onClick={() => setOpen(true)}
              title="Click to open assistant"
            >
              <Sparkles size={13} className="avatar-tip-sparkle" />
              <span>{unreadTip}</span>
            </div>
            <button
              type="button"
              className="avatar-tip-close"
              onClick={e => {
                e.stopPropagation();
                setUnreadTip(null);
              }}
              aria-label="Collapse / minimize tip"
              title="Collapse tip"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <button
          type="button"
          className="avatar-trigger-btn"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              setOpen(true);
              triggerCelebration();
            }
          }}
          aria-expanded={open}
          aria-label={open ? 'Close AURA AI Companion' : 'Open AURA AI Companion'}
          title={open ? 'Close Companion' : 'Chat with AURA-BOT Companion'}
        >
          <AvatarRenderer
            style={style}
            expression={expression}
            size={52}
            pointerPos={pointerPos}
            audioLevel={audioLevel}
            isHovered={isHovered}
          />
          <span className="avatar-trigger-label">
            <strong>{style === 'pip' ? 'PIP.EXE' : 'AURA-BOT'}</strong>
            <small>{open ? 'Close Chat' : `${memberName} • PG/Bio`}</small>
          </span>
        </button>
      </div>
    </div>
  );
}

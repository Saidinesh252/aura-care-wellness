import { Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ReadAloudButton({ text, label = 'Read instructions', className = '' }: {
  text: string;
  label?: string;
  className?: string;
}) {
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const [reading, setReading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Voice lists may populate asynchronously in browsers.
    window.speechSynthesis?.getVoices();
    return () => {
      if (!utterance.current) return;
      utterance.current = null;
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!utterance.current) return;
    utterance.current = null;
    window.speechSynthesis?.cancel();
    setReading(false);
  }, [text]);

  function toggle() {
    const synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') {
      setStatus('Read aloud is unavailable in this browser.');
      return;
    }
    if (utterance.current) {
      utterance.current = null;
      synth.cancel();
      setReading(false);
      return;
    }
    const voices = synth.getVoices().filter(voice => voice.localService && /^en(?:[-_]|$)/i.test(voice.lang));
    const voice = voices.find(candidate => /^en[-_]IN$/i.test(candidate.lang)) ??
      voices.find(candidate => candidate.default) ?? voices[0];
    if (!voice) {
      setStatus('A local English voice is needed for read aloud. The instructions are available on screen.');
      return;
    }

    setStatus('');
    const message = new SpeechSynthesisUtterance(text);
    message.voice = voice;
    message.lang = voice.lang;
    message.rate = .86;
    function finish() {
      if (utterance.current !== message) return;
      utterance.current = null;
      setReading(false);
    }
    message.onend = finish;
    message.onerror = event => {
      if (utterance.current === message && !['canceled', 'interrupted'].includes(event.error)) {
        setStatus('Read aloud could not start. The instructions are available on screen.');
      }
      finish();
    };
    synth.cancel();
    utterance.current = message;
    setReading(true);
    synth.speak(message);
  }

  return <div className={`read-aloud ${className}`}>
    <button type="button" className="button secondary" onClick={toggle}>
      {reading ? <Square size={15} aria-hidden /> : <Volume2 size={17} aria-hidden />}
      {reading ? 'Stop reading' : label}
    </button>
    {status && <p className="read-aloud-status" role="status">{status}</p>}
  </div>;
}

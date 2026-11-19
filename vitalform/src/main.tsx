import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import { App } from './App';
import './style.css';
import './planning.css';
import './reliability.css';
import './comfort.css';
import './auditPolish.css';

createRoot(document.getElementById('root')!).render(<StrictMode><MotionConfig reducedMotion="user"><App /></MotionConfig></StrictMode>);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const register = () => void navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).catch(() => undefined);
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

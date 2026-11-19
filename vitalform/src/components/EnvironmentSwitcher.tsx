import { Building2, House } from 'lucide-react';
import { useWorkspace } from '../store';

export function EnvironmentSwitcher() {
  const { environment, setEnvironment } = useWorkspace();
  return <div className="environment-switch" role="group" aria-label="Switch my environment">
    <button className={environment === 'home' ? 'selected' : ''} aria-pressed={environment === 'home'} onClick={() => setEnvironment('home')}><House size={15} /> Home Mode</button>
    <button className={environment === 'pg' ? 'selected' : ''} aria-pressed={environment === 'pg'} onClick={() => setEnvironment('pg')}><Building2 size={15} /> PG Mode</button>
  </div>;
}

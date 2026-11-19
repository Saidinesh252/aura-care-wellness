import { loadEnv, type Connect, type Plugin } from 'vite';
import { assistantAnswer, originAllowed, type AssistantConfig } from './pipAssistantServer';

interface AssistantIncoming {
  url?: string;
  method?: string;
  headers: Record<string, string | undefined>;
  socket: { remoteAddress?: string };
  setEncoding(encoding: 'utf8'): void;
  on(event: 'data', listener: (chunk: string) => void): void;
  on(event: 'end' | 'error', listener: () => void): void;
}

function assistantMiddleware(config: AssistantConfig): Connect.NextHandleFunction {
  const requests = new Map<string, { since: number; count: number }>();
  return (incoming, res, next) => {
    const req = incoming as unknown as AssistantIncoming;
    if (req.url?.split('?')[0] !== '/api/assistant') { next(); return; }
    const send = (status: number, body: Record<string, boolean | string>) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(body));
    };
    if (req.method === 'GET') { send(200, { configured: !!config.apiKey?.trim() }); return; }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); send(405, { error: 'Method not allowed.' }); return; }
    if (!originAllowed(req.headers.origin, req.headers.host) || req.headers['sec-fetch-site'] === 'cross-site') {
      send(403, { error: 'This endpoint accepts same-origin requests.' }); return;
    }
    if (!req.headers['content-type']?.startsWith('application/json')) {
      send(415, { error: 'Send a JSON body.' }); return;
    }
    if (Number(req.headers['content-length']) > 2_048) { send(413, { error: 'The request is too large.' }); return; }
    const now = Date.now();
    for (const [key, limit] of requests) if (now - limit.since >= 60_000) requests.delete(key);
    const address = req.socket.remoteAddress ?? 'unknown';
    const limit = requests.get(address) ?? { since: now, count: 0 };
    if (limit.count >= 8) { send(429, { error: 'Please wait and try again.' }); return; }
    requests.set(address, { since: limit.since, count: limit.count + 1 });

    let payload = '';
    let tooLarge = false;
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      if (tooLarge) return;
      payload += chunk;
      if (new TextEncoder().encode(payload).length > 2_048) {
        tooLarge = true;
        send(413, { error: 'The request is too large.' });
      }
    });
    req.on('end', () => {
      if (tooLarge) return;
      let question: unknown;
      try { question = JSON.parse(payload)?.question; }
      catch { send(400, { error: 'Send a valid JSON question.' }); return; }
      void assistantAnswer(question, config).then(result => send(result.status, result.body));
    });
    req.on('error', () => { if (!res.headersSent) send(400, { error: 'Could not read the request.' }); });
  };
}

export function assistantPlugin(): Plugin {
  let config: AssistantConfig = {};
  return {
    name: 'vitalform-pip-assistant',
    configResolved(viteConfig) {
      const env = loadEnv(viteConfig.mode, viteConfig.envDir, 'PIP_ASSISTANT_');
      config = { apiKey: env.PIP_ASSISTANT_API_KEY, model: env.PIP_ASSISTANT_MODEL };
    },
    configureServer(server) { server.middlewares.use(assistantMiddleware(config)); },
    configurePreviewServer(server) { server.middlewares.use(assistantMiddleware(config)); },
  };
}

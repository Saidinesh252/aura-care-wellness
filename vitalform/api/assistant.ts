import { assistantAnswer, originAllowed } from '../pipAssistantServer';

interface ApiRequest {
  method?: string;
  headers: { origin?: string; host?: string; 'sec-fetch-site'?: string; 'content-type'?: string };
  body?: { question?: unknown; query?: unknown };
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: Record<string, string | boolean>): void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const config = { apiKey: process.env.PIP_ASSISTANT_API_KEY, model: process.env.PIP_ASSISTANT_MODEL };
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ configured: Boolean(config.apiKey?.trim()) });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!originAllowed(req.headers.origin, req.headers.host) || req.headers['sec-fetch-site'] === 'cross-site') {
    return res.status(403).json({ error: 'This endpoint accepts same-origin requests.' });
  }
  if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).json({ error: 'Send a JSON body.' });
  const result = await assistantAnswer(req.body?.question ?? req.body?.query, config);
  return res.status(result.status).json(result.body);
}

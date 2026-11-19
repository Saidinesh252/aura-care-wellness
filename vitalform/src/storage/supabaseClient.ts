// Zero-dependency Supabase REST & Auth client using native browser fetch

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
               (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined);

const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
               (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined);

export const SUPABASE_URL = (envUrl && envUrl.trim() !== '') ? envUrl.trim().replace(/\/$/, '') : null;
export const SUPABASE_ANON_KEY = (envKey && envKey.trim() !== '') ? envKey.trim() : null;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const SESSION_KEY = 'auracare_supabase_session';

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
    user_metadata?: { display_name?: string };
  };
}

export function getStoredSession(): SupabaseSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: SupabaseSession | null) {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {}
}

function getHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY ?? '',
  };
  const activeToken = token ?? getStoredSession()?.access_token ?? SUPABASE_ANON_KEY;
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

export const supabaseRest = {
  async query<T = any>(table: string, queryParams = ''): Promise<{ data: T[] | null; error: string | null }> {
    if (!isSupabaseConfigured || !SUPABASE_URL) return { data: null, error: 'Supabase is not configured' };
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${queryParams}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const err = await res.text();
        return { data: null, error: err };
      }
      const data = await res.json();
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e?.message || 'Network error' };
    }
  },

  async upsert(table: string, payload: Record<string, any>, onConflict = ''): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured || !SUPABASE_URL) return { success: false, error: 'Supabase is not configured' };
    try {
      const url = `${SUPABASE_URL}/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err };
      }
      return { success: true, error: null };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  async update(table: string, payload: Record<string, any>, filterQuery: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured || !SUPABASE_URL) return { success: false, error: 'Supabase is not configured' };
    try {
      const url = `${SUPABASE_URL}/rest/v1/${table}?${filterQuery}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          ...getHeaders(),
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: err };
      }
      return { success: true, error: null };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  },
};

export const supabaseAuth = {
  async passwordAccess(email: string, password: string, displayName?: string): Promise<SupabaseSession | null> {
    if (!isSupabaseConfigured || !SUPABASE_URL) throw new Error('Account sign-in is unavailable. You can continue with your saved local data.');
    const signup = displayName !== undefined;
    const endpoint = signup ? 'signup' : 'token?grant_type=password';
    const response = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
      method: 'POST',
      headers: getHeaders(SUPABASE_ANON_KEY ?? undefined),
      body: JSON.stringify({ email, password, ...(signup ? { data: { display_name: displayName } } : {}) }),
      signal: AbortSignal.timeout(12000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.msg ?? body?.message ?? 'The account request could not be completed.');
    if (signup && !body?.access_token) return null;
    if (!body?.user?.id || typeof body.access_token !== 'string' || typeof body.refresh_token !== 'string') {
      throw new Error('The account server returned an incomplete session.');
    }
    const session = { access_token: body.access_token, refresh_token: body.refresh_token, user: body.user } satisfies SupabaseSession;
    saveSession(session);
    return session;
  },

  async signInWithOtp(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    if (!isSupabaseConfigured || !SUPABASE_URL) {
      return { success: false, message: '', error: 'Supabase credentials not found in environment' };
    }
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, create_user: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, message: '', error: err?.msg || err?.message || 'OTP request failed' };
      }
      return { success: true, message: `Magic login link / verification code sent to ${email}` };
    } catch (e: any) {
      return { success: false, message: '', error: e?.message || 'Network error' };
    }
  },

  async getUser(): Promise<{ id: string; email?: string } | null> {
    const session = getStoredSession();
    if (!session || !isSupabaseConfigured || !SUPABASE_URL) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'GET',
        headers: getHeaders(session.access_token),
      });
      if (!res.ok) {
        saveSession(null);
        return null;
      }
      const user = await res.json();
      return user ? { id: user.id, email: user.email } : null;
    } catch {
      return null;
    }
  },

  signOut(): void {
    const session = getStoredSession();
    saveSession(null);
    if (session && SUPABASE_URL && navigator.onLine) {
      void fetch(`${SUPABASE_URL}/auth/v1/logout?scope=local`, { method: 'POST', headers: getHeaders(session.access_token) }).catch(() => undefined);
    }
  },
};

import { isSupabaseConfigured, supabaseAuth, supabaseRest } from './supabaseClient';
import type { CloudUser, SharedCarePacket, StorageAdapter } from './types';
import type { CareDay } from '../familyTypes';
import type { WorkspaceData } from '../store';

const LOCAL_SHARES_STORAGE_KEY = 'auracare_local_family_shares';

function getLocalShares(): Record<string, SharedCarePacket> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_SHARES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalShare(packet: SharedCarePacket) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalShares();
    current[packet.syncCode] = packet;
    localStorage.setItem(LOCAL_SHARES_STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

/**
 * Encode a packet into a compact URL-safe base64 string for zero-backend sharing
 */
export function encodeP2PPacket(packet: SharedCarePacket): string {
  try {
    const json = JSON.stringify(packet);
    const encoded = btoa(encodeURIComponent(json));
    return `P2P_${encoded}`;
  } catch {
    return packet.syncCode;
  }
}

/**
 * Decode a zero-backend P2P packet
 */
export function decodeP2PPacket(codeOrPayload: string): SharedCarePacket | null {
  try {
    if (codeOrPayload.startsWith('P2P_')) {
      const payload = codeOrPayload.slice(4);
      const json = decodeURIComponent(atob(payload));
      return JSON.parse(json);
    }
    // Check local shares
    const local = getLocalShares();
    return local[codeOrPayload] ?? null;
  } catch {
    return null;
  }
}

export const hybridStorageAdapter: StorageAdapter = {
  get isCloudConfigured(): boolean {
    return isSupabaseConfigured;
  },

  get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  async getAuthState(): Promise<{ user: CloudUser | null }> {
    if (!isSupabaseConfigured) return { user: null };
    const user = await supabaseAuth.getUser();
    return { user };
  },

  async signInWithOtp(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    return supabaseAuth.signInWithOtp(email);
  },

  async signOut(): Promise<void> {
    supabaseAuth.signOut();
  },

  async syncToCloud(workspace: WorkspaceData): Promise<{ success: boolean; syncedAt?: string; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Cloud sync requires VITE_SUPABASE_URL in .env.local' };
    }
    const user = await supabaseAuth.getUser();
    if (!user) {
      return { success: false, error: 'Please sign in to sync with cloud' };
    }

    const { success, error } = await supabaseRest.upsert(
      'user_workspaces',
      {
        user_id: user.id,
        workspace_data: workspace,
        client_version: '1.0.0',
        updated_at: new Date().toISOString(),
      },
      'user_id'
    );

    if (!success) {
      return { success: false, error: error || 'Failed to sync to cloud' };
    }
    return { success: true, syncedAt: new Date().toLocaleTimeString() };
  },

  async fetchFromCloud(): Promise<{ success: boolean; data?: WorkspaceData; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Cloud sync requires VITE_SUPABASE_URL in .env.local' };
    }
    const user = await supabaseAuth.getUser();
    if (!user) {
      return { success: false, error: 'Please sign in to access cloud backup' };
    }

    const { data, error } = await supabaseRest.query<any>('user_workspaces', `?user_id=eq.${user.id}&select=*`);
    if (error || !data || data.length === 0) {
      return { success: false, error: error || 'No cloud workspace found for user' };
    }

    return { success: true, data: data[0].workspace_data };
  },

  async createFamilyShare(packet: SharedCarePacket): Promise<{ syncCode: string; shareUrl: string; isCloud: boolean }> {
    // 1. Always store locally first (local-first primary)
    saveLocalShare(packet);

    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';

    // 2. If Supabase is configured and online, push to PostgreSQL family_care_sync table
    if (isSupabaseConfigured && typeof navigator !== 'undefined' && navigator.onLine) {
      const { success } = await supabaseRest.upsert(
        'family_care_sync',
        {
          sync_code: packet.syncCode,
          member_id: packet.memberId,
          member_name: packet.memberName,
          relationship: packet.relationship,
          access_mode: packet.accessMode,
          packet: packet,
          updated_at: new Date().toISOString(),
        },
        'sync_code'
      );

      if (success) {
        return {
          syncCode: packet.syncCode,
          shareUrl: `${baseUrl}#family-sync/${packet.syncCode}`,
          isCloud: true,
        };
      }
    }

    // 3. Graceful fallback: Peer-to-Peer URL token
    const p2pToken = encodeP2PPacket(packet);
    return {
      syncCode: packet.syncCode,
      shareUrl: `${baseUrl}#family-sync/${p2pToken}`,
      isCloud: false,
    };
  },

  async fetchSharedFamilyProfile(
    syncCodeOrPayload: string
  ): Promise<{ success: boolean; packet?: SharedCarePacket; isCloud: boolean; error?: string }> {
    const trimmed = syncCodeOrPayload.trim();

    // 1. Check if it's a P2P encoded token or local share
    const p2p = decodeP2PPacket(trimmed);
    if (p2p) {
      return { success: true, packet: p2p, isCloud: false };
    }

    // 2. If Supabase is configured, fetch from cloud table
    if (isSupabaseConfigured && typeof navigator !== 'undefined' && navigator.onLine) {
      const { data, error } = await supabaseRest.query<any>(
        'family_care_sync',
        `?sync_code=eq.${trimmed}&select=*`
      );

      if (data && data.length > 0) {
        const item = data[0];
        return { success: true, packet: item.packet, isCloud: true };
      }
      return { success: false, isCloud: true, error: error || 'Family sync code not found on cloud server.' };
    }

    return {
      success: false,
      isCloud: false,
      error: 'Sync code not found locally. If using Cloud Sync, ensure Supabase is configured.',
    };
  },

  async updateSharedCare(
    syncCode: string,
    careDay: CareDay,
    waterMl: number
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Update local share
    const local = getLocalShares();
    if (local[syncCode]) {
      local[syncCode].careDay = careDay;
      local[syncCode].waterMl = waterMl;
      local[syncCode].updatedAt = new Date().toISOString();
      localStorage.setItem(LOCAL_SHARES_STORAGE_KEY, JSON.stringify(local));
    }

    // 2. If Supabase configured and collaborative, update remote PostgreSQL
    if (isSupabaseConfigured && typeof navigator !== 'undefined' && navigator.onLine) {
      // Fetch latest packet first to preserve member metadata
      const { data } = await supabaseRest.query<any>('family_care_sync', `?sync_code=eq.${syncCode}&select=*`);
      if (data && data.length > 0) {
        const currentPacket = data[0].packet as SharedCarePacket;
        if (currentPacket.accessMode === 'readonly') {
          return { success: false, error: 'This profile link is read-only.' };
        }
        currentPacket.careDay = careDay;
        currentPacket.waterMl = waterMl;
        currentPacket.updatedAt = new Date().toISOString();

        const { success, error } = await supabaseRest.update(
          'family_care_sync',
          { packet: currentPacket, updated_at: new Date().toISOString() },
          `sync_code=eq.${syncCode}`
        );
        return { success, error: error ?? undefined };
      }
    }

    return { success: true };
  },
};

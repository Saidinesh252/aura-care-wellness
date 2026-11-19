import type { CareDay, CareReminder } from '../familyTypes';
import type { WorkspaceData } from '../store';

export interface CloudUser {
  id: string;
  email?: string;
  createdAt?: string;
}

export interface SharedCarePacket {
  syncCode: string;
  memberId: string;
  memberName: string;
  relationship: string;
  age: number;
  accessMode: 'readonly' | 'collaborative';
  today: string;
  careDay: CareDay;
  careReminders: CareReminder[];
  waterMl: number;
  habits: Record<string, boolean>;
  updatedAt: string;
}

export interface StorageAdapter {
  readonly isCloudConfigured: boolean;
  readonly isOnline: boolean;
  getAuthState(): Promise<{ user: CloudUser | null }>;
  signInWithOtp(email: string): Promise<{ success: boolean; message: string; error?: string }>;
  signOut(): Promise<void>;
  syncToCloud(workspace: WorkspaceData): Promise<{ success: boolean; syncedAt?: string; error?: string }>;
  fetchFromCloud(): Promise<{ success: boolean; data?: WorkspaceData; error?: string }>;
  createFamilyShare(packet: SharedCarePacket): Promise<{ syncCode: string; shareUrl: string; isCloud: boolean }>;
  fetchSharedFamilyProfile(syncCodeOrPayload: string): Promise<{ success: boolean; packet?: SharedCarePacket; isCloud: boolean; error?: string }>;
  updateSharedCare(syncCode: string, careDay: CareDay, waterMl: number): Promise<{ success: boolean; error?: string }>;
}

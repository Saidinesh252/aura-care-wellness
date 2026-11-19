export interface NotificationConfig {
  enabled: boolean;
  hydration: boolean;
  hydrationIntervalMinutes: number; // e.g., 90 or 120 mins
  amSkincare: boolean;
  amSkincareTime: string; // "08:00"
  pmSkincare: boolean;
  pmSkincareTime: string; // "21:30"
  elderCare: boolean;
  elderCareTime: string; // "09:00"
  workout: boolean;
  workoutTime: string; // "18:00"
  lastHydrationAlert?: number;
  lastAmDate?: string;
  lastPmDate?: string;
  lastElderDate?: string;
  lastWorkoutDate?: string;
}

export const defaultNotificationConfig: NotificationConfig = {
  enabled: false,
  hydration: true,
  hydrationIntervalMinutes: 120,
  amSkincare: true,
  amSkincareTime: '08:00',
  pmSkincare: true,
  pmSkincareTime: '21:30',
  elderCare: true,
  elderCareTime: '09:00',
  workout: true,
  workoutTime: '18:00',
};

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (err) {
    console.warn('[Notifications] Permission request error:', err);
    return false;
  }
}

/**
 * Send local browser notification via Service Worker (preferred for PWA) or standard Notification
 */
export async function sendLocalNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: { url?: string };
  }
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultIcon = './icons/icon-192.png';
  const defaultBadge = './favicon.svg';

  const notificationOptions = {
    body: options?.body,
    icon: options?.icon ?? defaultIcon,
    badge: options?.badge ?? defaultBadge,
    tag: options?.tag,
    data: options?.data ?? { url: './' },
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    }

    new Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('[Notifications] Error sending notification:', err);
    try {
      new Notification(title, notificationOptions);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Send an immediate verification/test notification
 */
export async function sendTestNotification(): Promise<boolean> {
  return sendLocalNotification('✨ AURA-CARE Bio-Pulse Active', {
    body: 'PWA Notifications are active! You will receive daily hydration, skincare, and family wellness alerts.',
    tag: 'auracare-test',
    data: { url: './#dashboard' },
  });
}

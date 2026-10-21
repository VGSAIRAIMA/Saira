// Local service worker system notifications manager

export async function showLocalNotification(
  title: string,
  options: {
    body: string;
    slot: 'morning' | 'study';
    icon?: string;
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      const notificationOpts: NotificationOptions & { actions?: Array<{ action: string; title: string }> } = {
        body: options.body,
        icon: options.icon || '/icons/icon-192.png',
        badge: '/icons/favicon-32.png',
        tag: `saira-${options.slot}`,
        data: { slot: options.slot },
        actions: [
          { action: 'start', title: 'Start' },
          { action: 'snooze', title: 'Snooze 15m' },
        ],
      };
      await reg.showNotification(title, notificationOpts);
      return true;
    }
  } catch (err) {
    console.warn('Could not display local notification via Service Worker:', err);
  }

  return false;
}

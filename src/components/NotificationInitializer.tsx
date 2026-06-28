'use client';

import { useEffect } from 'react';

export default function NotificationInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initFlag = localStorage.getItem('notifications_initialized');
    if (initFlag) {
      localStorage.removeItem('notifications_initialized');
      localStorage.removeItem('calitrack_notifications');
    }
  }, []);

  return null;
}

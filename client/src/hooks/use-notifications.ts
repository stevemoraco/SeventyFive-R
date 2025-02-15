import { useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export function useNotifications() {
  const { toast } = useToast();

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive"
      });
      return false;
    }

    // Always request permission unless already granted
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll receive reminders for incomplete tasks",
        });
      }
      return permission === 'granted';
    }

    return true;
  }, [toast]);

  const scheduleNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      // Schedule for next check time
      const notification = new Notification(title, {
        icon: '/icon.webp',
        badge: '/icon.webp',
        ...options,
      });

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  }, []);

  const scheduleTaskReminders = useCallback((incompleteTasks: string[]) => {
    if (incompleteTasks.length === 0) return;

    const now = new Date();
    // Schedule next check in 3 hours if during the day (6 AM - 9 PM)
    const hour = now.getHours();
    if (hour >= 6 && hour <= 21) {
      scheduleNotification(
        "75 Hard - Incomplete Tasks",
        {
          body: `You still need to complete: ${incompleteTasks.join(', ')}`,
          tag: 'task-reminder', // Prevents duplicate notifications
        }
      );
    }
  }, [scheduleNotification]);

  return {
    requestPermission,
    scheduleTaskReminders
  };
}
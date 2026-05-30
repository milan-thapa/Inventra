// src/hooks/use-notifications.ts
/**
 * React hook for real-time notifications using SSE
 */

import { useEffect, useState, useCallback } from "react";
import { useProfileStore } from "@/stores/profile-store";
import type { Notification } from "@prisma/client";

export function useNotifications() {
  const { getActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProfile) return;

    let eventSource: EventSource | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource("/api/notifications/stream");

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "notifications") {
              setNotifications(data.data);
            }
          } catch (e) {
            console.error("[SSE Parse Error]", e);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          setError("Connection lost. Reconnecting...");
          eventSource?.close();
          // Reconnect after 3 seconds
          setTimeout(connect, 3000);
        };
      } catch (e) {
        setError("Failed to connect to notification stream");
        console.error("[SSE Connection Error]", e);
      }
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, [activeProfile]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    error,
  };
}

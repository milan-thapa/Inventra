// src/components/layout/notifications-panel.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CreditCard, CheckSquare } from "lucide-react";
import { useProfileStore, useUIStore } from "@/stores/profile-store";
import { cn } from "@/lib/utils";
import { getNotifications, markNotificationsAsRead } from "@/lib/actions/notification";
import type { Notification } from "@prisma/client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function NotificationsPanel() {
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  const { getActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (notificationsOpen && activeProfile) {
      const fetchNotifications = async () => {
        setLoading(true);
        const res = await getNotifications(activeProfile.id);
        if (res.data) {
          setNotifications(res.data);
        }
        setLoading(false);
        // Mark as read after fetching
        await markNotificationsAsRead(activeProfile.id);
      };
      fetchNotifications();
    }
  }, [notificationsOpen, activeProfile]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderIcon = (type: string) => {
    switch (type) {
      case "PAYMENT":
        return <CreditCard className="w-4 h-4" />;
      case "TASK":
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getIconBgClass = (type: string) => {
    switch (type) {
      case "PAYMENT":
        return "bg-rose-500/15 text-rose-500";
      case "TASK":
        return "bg-blue-500/15 text-blue-500";
      default:
        return "bg-gray-500/15 text-gray-500";
    }
  };

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setNotificationsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-2xl z-40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse" />
                  <p className="text-sm">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <Link href={notif.link || "#"} key={notif.id} passHref>
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0 cursor-pointer">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        getIconBgClass(notif.type),
                        !notif.isRead && "ring-2 ring-emerald-500"
                      )}>
                        {renderIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


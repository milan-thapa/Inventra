// src/components/layout/notifications-panel.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CreditCard, CheckSquare, AlertTriangle, Info, Zap, Trash2, Check } from "lucide-react";
import { useProfileStore, useUIStore } from "@/stores/profile-store";
import { cn } from "@/lib/utils";
import { getNotifications, markNotificationsAsRead, markAllNotificationsAsRead, deleteNotification } from "@/lib/actions/notification";
import type { Notification } from "@prisma/client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function NotificationsPanel() {
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  const { getActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "SALES" | "PURCHASE" | "PAYMENT">("ALL");

  useEffect(() => {
    if (notificationsOpen && activeProfile) {
      const fetchNotifications = async () => {
        setLoading(true);
        const options: any = {};
        if (filter === "UNREAD") options.unreadOnly = true;
        if (filter !== "ALL" && filter !== "UNREAD") options.category = filter;
        
        const res = await getNotifications(activeProfile.id, options);
        if (res.data) {
          setNotifications(res.data);
        }
        setLoading(false);
      };
      fetchNotifications();
    }
  }, [notificationsOpen, activeProfile, filter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderIcon = (type: string, priority: string) => {
    if (priority === "URGENT") return <AlertTriangle className="w-4 h-4" />;
    if (priority === "HIGH") return <Zap className="w-4 h-4" />;
    
    switch (type) {
      case "PAYMENT":
        return <CreditCard className="w-4 h-4" />;
      case "TASK":
        return <CheckSquare className="w-4 h-4" />;
      case "REMINDER":
        return <Bell className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getIconBgClass = (type: string, priority: string) => {
    if (priority === "URGENT") return "bg-red-500/15 text-red-500";
    if (priority === "HIGH") return "bg-orange-500/15 text-orange-500";
    if (priority === "LOW") return "bg-gray-500/15 text-gray-500";
    
    switch (type) {
      case "PAYMENT":
        return "bg-rose-500/15 text-rose-500";
      case "TASK":
        return "bg-blue-500/15 text-blue-500";
      case "REMINDER":
        return "bg-amber-500/15 text-amber-500";
      default:
        return "bg-emerald-500/15 text-emerald-500";
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    e.preventDefault();
    await markNotificationsAsRead(activeProfile?.id || "", notificationId);
    setNotifications(notifications.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(activeProfile?.id || "");
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    e.preventDefault();
    await deleteNotification(activeProfile?.id || "", notificationId);
    setNotifications(notifications.filter(n => n.id !== notificationId));
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
            className="absolute right-0 top-full mt-2 w-96 bg-popover border border-border rounded-xl shadow-2xl z-40 overflow-hidden"
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
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30">
              {["ALL", "UNREAD", "SALES", "PURCHASE", "PAYMENT"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={cn(
                    "text-xs px-2 py-1 rounded-md transition-colors",
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="max-h-96 overflow-y-auto">
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
                    <div className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0 cursor-pointer group",
                      !notif.isRead && "bg-accent/30"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        getIconBgClass(notif.type, notif.priority),
                        !notif.isRead && "ring-2 ring-emerald-500"
                      )}>
                        {renderIcon(notif.type, notif.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground/60">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                          {notif.priority === "URGENT" && (
                            <span className="text-xs text-red-500 font-medium">Urgent</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notif.id)}
                            className="p-1 rounded hover:bg-accent text-muted-foreground"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notif.id)}
                          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
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


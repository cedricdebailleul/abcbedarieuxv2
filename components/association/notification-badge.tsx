"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface NotificationBadgeProps {
  className?: string;
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/association/notifications");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
        setUnreadCount(0);
      }
    };

    fetchNotifications();

    // Actualiser toutes les 2 minutes pour plus de réactivité
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (unreadCount === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className={`ml-auto h-5 min-w-[20px] px-1 text-xs ${className}`}
    >
      {unreadCount > 9 ? "9+" : unreadCount}
    </Badge>
  );
}
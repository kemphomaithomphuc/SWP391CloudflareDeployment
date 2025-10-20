import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from './ui/badge';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationBadgeProps {
  className?: string;
  showCount?: boolean;
}

export default function NotificationBadge({ className = '', showCount = true }: NotificationBadgeProps) {
  const { unreadCount } = useNotifications();

  return (
    <div className={`relative ${className}`}>
      <Bell className="w-5 h-5" />
      {showCount && unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  );
}

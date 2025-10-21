import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, createNotification, Notification as APINotification } from '../services/api';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: APINotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getUnreadCount: () => Promise<void>;
  createNotification: (notificationData: {
    title: string;
    content: string;
    type: 'booking' | 'payment' | 'issue' | 'penalty' | 'general' | 'invoice' | 'late_arrival' | 'charging_complete' | 'overstay_warning' | 'report_success' | 'booking_confirmed';
  }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<APINotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications from API
  const refreshNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      const fetchedNotifications = await getNotifications();
      setNotifications(fetchedNotifications);
      
      // Update unread count
      const count = fetchedNotifications.filter(n => !n.isRead).length;
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      
      // Handle 401 errors gracefully
      if (err.response?.status === 401) {
        console.log('401 error in notifications - user will be redirected to login');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      setError('Failed to load notifications');
      // Don't show error toast for 401 as user will be redirected
      if (err.response?.status !== 401) {
        toast.error('Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get unread count from API
  const getUnreadCount = async () => {
    try {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        setUnreadCount(0);
        return;
      }
      
      // Instead of relying on API count, calculate from actual notifications
      const fetchedNotifications = await getNotifications();
      const localCount = fetchedNotifications.filter(n => !n.isRead).length;
      
      console.log("=== FRONTEND NOTIFICATION COUNT DEBUG ===");
      console.log("Total notifications fetched:", fetchedNotifications.length);
      console.log("Unread notifications (local calculation):", localCount);
      
      // Also get API count for comparison
      try {
        const apiCount = await getUnreadNotificationCount();
        console.log("API count:", apiCount);
        console.log("Difference:", localCount - apiCount);
      } catch (apiErr) {
        console.log("API count failed, using local calculation");
      }
      
      setUnreadCount(localCount);
    } catch (err: any) {
      console.error('Error getting unread count:', err);
      
      // Handle 401 errors gracefully
      if (err.response?.status === 401) {
        console.log('401 error in unread count - user will be redirected to login');
        setUnreadCount(0);
        return;
      }
      
      // Don't show error toast for unread count as it's not critical
      // Reset to 0 if there's an error
      setUnreadCount(0);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to perform this action');
        return;
      }
      
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.notificationId === notificationId 
            ? { ...notif, isRead: true } 
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast.success('Notification marked as read');
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to perform this action');
        return;
      }
      
      await markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Create a new notification
  const createNotificationHandler = async (notificationData: {
    title: string;
    content: string;
    type: 'booking' | 'payment' | 'issue' | 'penalty' | 'general' | 'invoice' | 'late_arrival' | 'charging_complete' | 'overstay_warning' | 'report_success' | 'booking_confirmed';
  }) => {
    try {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to create notifications');
        return;
      }
      
      const newNotification = await createNotification(notificationData);
      
      // Add the new notification to the local state
      setNotifications(prev => [newNotification, ...prev]);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      console.log('Notification created successfully:', newNotification);
    } catch (err) {
      console.error('Error creating notification:', err);
      toast.error('Failed to create notification');
    }
  };

  // Load notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, []);

  // Set up polling for unread count (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      getUnreadCount();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    createNotification: createNotificationHandler,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

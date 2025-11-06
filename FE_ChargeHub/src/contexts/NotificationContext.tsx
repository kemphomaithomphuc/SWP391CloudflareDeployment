import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
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
    const prevUnreadRef = useRef<number>(0);

    // Load notifications from API
    const refreshNotifications = useCallback(async () => {
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

            //MERGE STATE - Giữ lại isRead của notifications đã có trong local state
            setNotifications(prev => {
                return fetchedNotifications.map(fetched => {
                    // Tìm notification cũ trong state
                    const existing = prev.find(n => n.notificationId === fetched.notificationId);

                    // Nếu backend trả về isRead undefined/null và local state có isRead = true
                    // → Giữ lại isRead từ local state
                    if (existing && existing.isRead && (fetched.isRead === undefined || fetched.isRead === null)) {
                        return { ...fetched, isRead: true };
                    }

                    // Nếu backend trả về isRead rõ ràng → dùng từ backend
                    if (fetched.isRead !== undefined && fetched.isRead !== null) {
                        return fetched;
                    }

                    // Fallback: dùng từ local state nếu có
                    if (existing) {
                        return { ...fetched, isRead: existing.isRead };
                    }

                    // Notification mới → default false
                    return { ...fetched, isRead: false };
                });
            });

            // Update unread count sau khi merge
            setNotifications(merged => {
                const count = merged.filter(n => !n.isRead).length;
                setUnreadCount(count);
                return merged;
            });

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
    }, []);

    // Get unread count from API (for polling - lightweight, only updates count)
    // Use functional setState to access current state without dependency
    const getUnreadCount = useCallback(async () => {
        try {
            // Check if user is authenticated before making API call
            const token = localStorage.getItem('token');
            if (!token) {
                setUnreadCount(0);
                prevUnreadRef.current = 0;
                return;
            }

            // Only fetch count, don't update full notifications list to avoid re-renders
            const apiCount = await getUnreadNotificationCount();
            const previousCount = prevUnreadRef.current;

            // Use functional setState to get current value without dependency
            setUnreadCount(currentCount => {
                // Only update if count actually changed
                if (apiCount !== currentCount) {
                    // Show toast if new notifications arrived (count increased)
                    if (apiCount > previousCount && previousCount > 0) {
                        const newNum = apiCount - previousCount;
                        toast.success(
                            newNum === 1 ? 'Bạn có 1 thông báo mới' : `Bạn có ${newNum} thông báo mới`
                        );
                    }

                    // Update previous count for next comparison
                    prevUnreadRef.current = apiCount;
                    return apiCount;
                }
                return currentCount; // No change, return current value
            });
        } catch (err: any) {
            console.error('Error getting unread count:', err);

            // Handle 401 errors gracefully
            if (err.response?.status === 401) {
                console.log('401 error in unread count - user will be redirected to login');
                setUnreadCount(0);
                prevUnreadRef.current = 0;
                return;
            }

            // Don't show error toast for unread count as it's not critical
            // Don't reset count on error to avoid UI flicker
        }
    }, []); // No dependencies - stable function

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId: number) => {
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
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
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
    }, []);

    // Create a new notification
    const createNotificationHandler = useCallback(async (notificationData: {
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
    }, []);

    // Load notifications on mount
    useEffect(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    // Initialize previous unread count when notifications first load
    useEffect(() => {
        if (notifications.length > 0 && prevUnreadRef.current === 0 && unreadCount > 0) {
            prevUnreadRef.current = unreadCount;
        }
    }, [notifications.length, unreadCount]); // Update when notifications first arrive

    // Set up polling for unread count (every 10 seconds)
    // Only poll when user is authenticated (has token)
    // getUnreadCount is stable (no dependencies), so we can include it safely
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        // Create interval only if token exists
        const interval = setInterval(() => {
            const currentToken = localStorage.getItem('token');
            // Only poll if token still exists
            if (currentToken) {
                getUnreadCount();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [getUnreadCount]); // Safe because getUnreadCount is stable (no deps)

    // Memoize context value to prevent unnecessary re-renders
    const value: NotificationContextType = useMemo(() => ({
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        getUnreadCount,
        createNotification: createNotificationHandler,
    }), [notifications, unreadCount, loading, error, refreshNotifications, markAsRead, markAllAsRead, getUnreadCount, createNotificationHandler]);

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

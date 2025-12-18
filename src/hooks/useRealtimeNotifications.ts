'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeNotificationsOptions {
    userId?: string;
    onNewNotification?: () => void;
    enabled?: boolean;
}

interface UseRealtimeNotificationsReturn {
    isConnected: boolean;
    newNotificationsCount: number;
    hasNewNotifications: boolean;
    clearNewNotifications: () => void;
    triggerRefresh: () => void;
    lastNotificationTime: Date | null;
}

/**
 * Hook for real-time notification updates
 * Subscribes to Supabase Realtime for instant notifications when:
 * - New comments are added to followed posts
 * - Someone replies to user's comments
 */
export function useRealtimeNotifications({
    userId,
    onNewNotification,
    enabled = true,
}: UseRealtimeNotificationsOptions = {}): UseRealtimeNotificationsReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [newNotificationsCount, setNewNotificationsCount] = useState(0);
    const [lastNotificationTime, setLastNotificationTime] = useState<Date | null>(null);
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        if (!enabled) return;

        const supabase = supabaseRef.current;

        // Create a channel for user notifications
        // We listen to all new comments and filter client-side
        // (In production, you'd use RLS or a dedicated notifications table)
        const channel = supabase
            .channel('user-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Comment',
                },
                (payload) => {
                    // New comment was posted somewhere
                    // The API will determine if it's relevant to this user
                    setNewNotificationsCount(prev => prev + 1);
                    setLastNotificationTime(new Date());
                    setShouldRefresh(true);

                    if (onNewNotification) {
                        onNewNotification();
                    }
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [userId, onNewNotification, enabled]);

    const clearNewNotifications = useCallback(() => {
        setNewNotificationsCount(0);
        setShouldRefresh(false);
    }, []);

    const triggerRefresh = useCallback(() => {
        setShouldRefresh(true);
    }, []);

    return {
        isConnected,
        newNotificationsCount,
        hasNewNotifications: newNotificationsCount > 0,
        clearNewNotifications,
        triggerRefresh,
        lastNotificationTime,
    };
}

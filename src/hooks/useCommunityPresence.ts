'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
    onlineCount: number;
    isConnected: boolean;
}

/**
 * Hook for realtime presence tracking in a community
 * Uses Supabase Realtime channels for true realtime updates
 */
export function useCommunityPresence(communityId: string): PresenceState {
    const [onlineCount, setOnlineCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!communityId) return;

        const supabase = createClient();
        let channel: RealtimeChannel;

        async function setupPresence() {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            // Create a presence channel for this community
            channel = supabase.channel(`community:${communityId}`, {
                config: {
                    presence: {
                        key: user?.id || `anon-${Math.random().toString(36).substr(2, 9)}`,
                    },
                },
            });

            // Track presence state changes
            channel.on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const uniqueUsers = Object.keys(state).length;
                setOnlineCount(uniqueUsers);
            });

            channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
                // Someone joined
                const state = channel.presenceState();
                setOnlineCount(Object.keys(state).length);
            });

            channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                // Someone left
                const state = channel.presenceState();
                setOnlineCount(Object.keys(state).length);
            });

            // Subscribe and track presence
            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    // Track this user's presence
                    await channel.track({
                        online_at: new Date().toISOString(),
                        user_id: user?.id || 'anonymous',
                    });
                }
            });
        }

        setupPresence();

        // Cleanup on unmount
        return () => {
            if (channel) {
                channel.untrack();
                supabase.removeChannel(channel);
            }
        };
    }, [communityId]);

    return { onlineCount, isConnected };
}

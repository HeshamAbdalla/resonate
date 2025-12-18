'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceUser {
    id: string;
    username: string;
    image: string | null;
    online_at: string;
}

interface PresenceState {
    users: PresenceUser[];
    isConnected: boolean;
}

/**
 * Hook for realtime presence tracking with user info
 * Returns list of users currently in the room
 */
export function useRealtimePresenceRoom(roomName: string): PresenceState {
    const [users, setUsers] = useState<PresenceUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!roomName) return;

        const supabase = createClient();
        let channel: RealtimeChannel;

        async function setupPresence() {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch the user's profile from the database to get their actual profile picture
            let profileImage: string | null = null;
            let profileUsername: string = 'Anonymous';

            if (user) {
                try {
                    const response = await fetch('/api/auth/me');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.user) {
                            profileImage = data.user.image || null;
                            profileUsername = data.user.username || user.email?.split('@')[0] || 'Anonymous';
                        }
                    }
                } catch {
                    // Fallback to metadata if API fails
                    profileImage = user.user_metadata?.avatar_url || null;
                    profileUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous';
                }
            }

            // Create a presence channel for this room
            channel = supabase.channel(`room:${roomName}`, {
                config: {
                    presence: {
                        key: user?.id || `anon-${Math.random().toString(36).substr(2, 9)}`,
                    },
                },
            });

            // Track presence state changes
            channel.on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const presenceUsers: PresenceUser[] = [];

                Object.entries(state).forEach(([key, presences]) => {
                    if (presences && presences.length > 0) {
                        const presence = presences[0] as any;
                        presenceUsers.push({
                            id: key,
                            username: presence.username || 'Anonymous',
                            image: presence.image || null,
                            online_at: presence.online_at,
                        });
                    }
                });

                setUsers(presenceUsers);
            });

            // Subscribe and track presence
            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);

                    // Track this user's presence with their actual profile info
                    await channel.track({
                        online_at: new Date().toISOString(),
                        username: profileUsername,
                        image: profileImage,
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
    }, [roomName]);

    return { users, isConnected };
}

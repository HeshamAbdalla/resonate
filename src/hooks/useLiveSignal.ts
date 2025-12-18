'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface LiveActivity {
    postId: string;
    commentId: string;
    authorUsername: string;
    timestamp: string;
    event: 'new_comment' | 'new_reply';
}

interface UseLiveSignalOptions {
    onActivity?: (activity: LiveActivity) => void;
    autoRefresh?: boolean;
}

/**
 * Hook for real-time live signal feed updates
 * Subscribes to Supabase Realtime for instant comment notifications
 */
export function useLiveSignal({ onActivity, autoRefresh = true }: UseLiveSignalOptions = {}) {
    const [isConnected, setIsConnected] = useState(false);
    const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
    const [lastActivityTime, setLastActivityTime] = useState<Date | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabaseRef = useRef(createClient());

    // Subscribe to realtime comment changes
    useEffect(() => {
        const supabase = supabaseRef.current;

        // Create a channel for live signal updates
        const channel = supabase
            .channel('live-signal-feed')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Comment',
                },
                (payload) => {
                    const newComment = payload.new as {
                        id: string;
                        postId: string;
                        parentId: string | null;
                        authorId: string;
                        createdAt: string;
                    };

                    const activity: LiveActivity = {
                        postId: newComment.postId,
                        commentId: newComment.id,
                        authorUsername: 'Someone', // Will be enhanced when we fetch user info
                        timestamp: newComment.createdAt,
                        event: newComment.parentId ? 'new_reply' : 'new_comment',
                    };

                    setLiveActivities(prev => [activity, ...prev].slice(0, 50));
                    setLastActivityTime(new Date());

                    if (onActivity) {
                        onActivity(activity);
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
    }, [onActivity]);

    // Clear old activities (older than 5 minutes)
    useEffect(() => {
        const interval = setInterval(() => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            setLiveActivities(prev =>
                prev.filter(a => new Date(a.timestamp) > fiveMinutesAgo)
            );
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Get count of recent activities
    const recentActivityCount = liveActivities.filter(a => {
        const activityTime = new Date(a.timestamp);
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        return activityTime > oneMinuteAgo;
    }).length;

    return {
        isConnected,
        liveActivities,
        lastActivityTime,
        recentActivityCount,
    };
}

/**
 * Hook for subscribing to a specific post's live updates
 */
export function useLivePost(postId: string) {
    const [commentCount, setCommentCount] = useState(0);
    const [newComments, setNewComments] = useState<string[]>([]);
    const [isLive, setIsLive] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        const supabase = supabaseRef.current;

        const channel = supabase
            .channel(`post-${postId}-live`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Comment',
                    filter: `postId=eq.${postId}`,
                },
                (payload) => {
                    const newComment = payload.new as { id: string };
                    setNewComments(prev => [...prev, newComment.id]);
                    setCommentCount(prev => prev + 1);
                    setIsLive(true);

                    // Reset live status after 2 minutes of no activity
                    setTimeout(() => setIsLive(false), 2 * 60 * 1000);
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [postId]);

    const clearNewComments = useCallback(() => {
        setNewComments([]);
    }, []);

    return {
        commentCount,
        newComments,
        isLive,
        clearNewComments,
    };
}

/**
 * Broadcast a live activity event to all connected clients
 * Called from the server when a new comment is created
 */
export async function broadcastLiveActivity(
    postId: string,
    commentId: string,
    authorUsername: string,
    isReply: boolean
) {
    const supabase = createClient();

    await supabase.channel('live-signal-feed').send({
        type: 'broadcast',
        event: 'live_activity',
        payload: {
            postId,
            commentId,
            authorUsername,
            timestamp: new Date().toISOString(),
            event: isReply ? 'new_reply' : 'new_comment',
        },
    });
}

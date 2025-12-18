'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface NewCommentEvent {
    id: string;
    postId: string;
    authorId: string;
    parentId: string | null;
    createdAt: string;
}

interface UseRealtimeCommentsOptions {
    postId: string;
    onNewComment?: (comment: NewCommentEvent) => void;
    enabled?: boolean;
}

interface UseRealtimeCommentsReturn {
    isConnected: boolean;
    newCommentsCount: number;
    hasNewComments: boolean;
    clearNewComments: () => void;
    lastCommentTime: Date | null;
}

/**
 * Hook for real-time comment updates on a specific post
 * Subscribes to Supabase Realtime for instant notifications when new comments are added
 */
export function useRealtimeComments({
    postId,
    onNewComment,
    enabled = true,
}: UseRealtimeCommentsOptions): UseRealtimeCommentsReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [newCommentsCount, setNewCommentsCount] = useState(0);
    const [lastCommentTime, setLastCommentTime] = useState<Date | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        if (!enabled || !postId) return;

        const supabase = supabaseRef.current;

        // Create a channel for this specific post's comments
        const channel = supabase
            .channel(`post-${postId}-comments`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Comment',
                    filter: `postId=eq.${postId}`,
                },
                (payload) => {
                    const newComment = payload.new as NewCommentEvent;

                    setNewCommentsCount(prev => prev + 1);
                    setLastCommentTime(new Date());

                    if (onNewComment) {
                        onNewComment(newComment);
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
    }, [postId, onNewComment, enabled]);

    const clearNewComments = useCallback(() => {
        setNewCommentsCount(0);
    }, []);

    return {
        isConnected,
        newCommentsCount,
        hasNewComments: newCommentsCount > 0,
        clearNewComments,
        lastCommentTime,
    };
}

/**
 * Hook for tracking typing indicators in a post
 * Uses Supabase Realtime Broadcast for ephemeral events
 */
export function useTypingIndicator(postId: string) {
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabaseRef = useRef(createClient());
    const typingTimeoutRef = useRef<{ [userId: string]: NodeJS.Timeout }>({});

    useEffect(() => {
        if (!postId) return;

        const supabase = supabaseRef.current;

        const channel = supabase
            .channel(`post-${postId}-typing`)
            .on('broadcast', { event: 'typing' }, (payload) => {
                const { userId, username } = payload.payload as { userId: string; username: string };

                // Clear existing timeout for this user
                if (typingTimeoutRef.current[userId]) {
                    clearTimeout(typingTimeoutRef.current[userId]);
                }

                // Add user to typing list if not already there
                setTypingUsers(prev => {
                    if (!prev.includes(username)) {
                        return [...prev, username];
                    }
                    return prev;
                });

                // Remove user after 3 seconds of no typing
                typingTimeoutRef.current[userId] = setTimeout(() => {
                    setTypingUsers(prev => prev.filter(u => u !== username));
                }, 3000);
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            // Clear all timeouts
            Object.values(typingTimeoutRef.current).forEach(timeout => clearTimeout(timeout));

            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [postId]);

    const sendTyping = useCallback(async (userId: string, username: string) => {
        if (channelRef.current) {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { userId, username },
            });
        }
    }, []);

    return {
        typingUsers,
        sendTyping,
    };
}

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimePostVotesOptions {
    postId: string;
    initialScore: number;
    onScoreChange?: (newScore: number) => void;
    enabled?: boolean;
}

interface UseRealtimePostVotesReturn {
    isConnected: boolean;
    realtimeScore: number;
    hasRemoteUpdate: boolean;
    clearRemoteUpdate: () => void;
}

/**
 * Hook for real-time post vote count updates
 * Subscribes to Vote table changes for a specific post
 */
export function useRealtimePostVotes({
    postId,
    initialScore,
    onScoreChange,
    enabled = true,
}: UseRealtimePostVotesOptions): UseRealtimePostVotesReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [realtimeScore, setRealtimeScore] = useState(initialScore);
    const [hasRemoteUpdate, setHasRemoteUpdate] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabaseRef = useRef(createClient());

    // Update score when initialScore changes (from user's own vote)
    useEffect(() => {
        setRealtimeScore(initialScore);
    }, [initialScore]);

    useEffect(() => {
        if (!enabled || !postId) return;

        const supabase = supabaseRef.current;

        // Subscribe to vote changes for this specific post
        const channel = supabase
            .channel(`post-${postId}-votes`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'Vote',
                    filter: `postId=eq.${postId}`,
                },
                async () => {
                    // Vote changed, fetch the new score
                    try {
                        const res = await fetch(`/api/posts/${postId}/vote`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.score !== undefined) {
                                setRealtimeScore(data.score);
                                setHasRemoteUpdate(true);
                                if (onScoreChange) {
                                    onScoreChange(data.score);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching updated score:', error);
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
    }, [postId, onScoreChange, enabled]);

    const clearRemoteUpdate = useCallback(() => {
        setHasRemoteUpdate(false);
    }, []);

    return {
        isConnected,
        realtimeScore,
        hasRemoteUpdate,
        clearRemoteUpdate,
    };
}

interface UseRealtimeCommentVotesOptions {
    commentId: string;
    initialScore: number;
    onScoreChange?: (newScore: number) => void;
    enabled?: boolean;
}

/**
 * Hook for real-time comment vote count updates
 */
export function useRealtimeCommentVotes({
    commentId,
    initialScore,
    onScoreChange,
    enabled = true,
}: UseRealtimeCommentVotesOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const [realtimeScore, setRealtimeScore] = useState(initialScore);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        setRealtimeScore(initialScore);
    }, [initialScore]);

    useEffect(() => {
        if (!enabled || !commentId) return;

        const supabase = supabaseRef.current;

        const channel = supabase
            .channel(`comment-${commentId}-votes`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'CommentVote',
                    filter: `commentId=eq.${commentId}`,
                },
                async () => {
                    // Vote changed, fetch the new score
                    try {
                        const res = await fetch(`/api/comments/${commentId}/vote`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.score !== undefined) {
                                setRealtimeScore(data.score);
                                if (onScoreChange) {
                                    onScoreChange(data.score);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching updated comment score:', error);
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
    }, [commentId, onScoreChange, enabled]);

    return {
        isConnected,
        realtimeScore,
    };
}

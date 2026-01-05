'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useRealtimePostVotes } from '@/hooks/useRealtimeVotes';

interface VoteButtonsProps {
    postId: string;
    initialScore: number;
    vertical?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function VoteButtons({ postId, initialScore, vertical = true, size = 'md' }: VoteButtonsProps) {
    const [score, setScore] = useState(initialScore);
    const [userVote, setUserVote] = useState<'UP' | 'DOWN' | null>(null);
    const [isAnimating, setIsAnimating] = useState<'up' | 'down' | null>(null);
    const [showRemoteUpdate, setShowRemoteUpdate] = useState(false);

    // Real-time vote updates from other users
    const { isConnected, realtimeScore, hasRemoteUpdate, clearRemoteUpdate } = useRealtimePostVotes({
        postId,
        initialScore: score,
        onScoreChange: useCallback((newScore: number) => {
            // Only show animation if score actually changed from server
            if (newScore !== score) {
                setShowRemoteUpdate(true);
                setTimeout(() => setShowRemoteUpdate(false), 1000);
            }
        }, [score]),
    });

    // Sync with realtime score when it changes from others
    useEffect(() => {
        if (hasRemoteUpdate && realtimeScore !== score) {
            setScore(realtimeScore);
            clearRemoteUpdate();
        }
    }, [realtimeScore, hasRemoteUpdate, score, clearRemoteUpdate]);

    useEffect(() => {
        // Fetch user's existing vote
        fetch(`/api/posts/${postId}/vote`)
            .then(res => res.json())
            .then(data => {
                setUserVote(data.userVote);
                if (data.score !== undefined) {
                    setScore(data.score);
                }
            })
            .catch(() => { });
    }, [postId]);

    const handleVote = async (type: 'UP' | 'DOWN') => {
        // Optimistic update
        const wasVoted = userVote === type;
        const wasOpposite = userVote && userVote !== type;

        setIsAnimating(type === 'UP' ? 'up' : 'down');

        if (wasVoted) {
            setScore(prev => type === 'UP' ? prev - 1 : prev + 1);
            setUserVote(null);
        } else if (wasOpposite) {
            setScore(prev => type === 'UP' ? prev + 2 : prev - 2);
            setUserVote(type);
        } else {
            setScore(prev => type === 'UP' ? prev + 1 : prev - 1);
            setUserVote(type);
        }

        try {
            const res = await fetch(`/api/posts/${postId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });

            if (res.ok) {
                const data = await res.json();
                setScore(data.score);
                setUserVote(data.userVote);
            }
        } catch (error) {
            // Revert on error
            setScore(initialScore);
            setUserVote(null);
        }

        setTimeout(() => setIsAnimating(null), 300);
    };

    const sizeClasses = {
        sm: { icon: 'w-4 h-4', text: 'text-sm', btn: 'btn-sm min-h-[44px] min-w-[44px]' },
        md: { icon: 'w-5 h-5', text: 'text-base', btn: 'btn-sm min-h-[44px] min-w-[44px]' },
        lg: { icon: 'w-6 h-6', text: 'text-lg', btn: 'btn-md min-h-[48px] min-w-[48px]' },
    };

    const formatScore = (score: number) => {
        if (Math.abs(score) >= 1000) return `${(score / 1000).toFixed(1)}k`;
        return score.toString();
    };

    return (
        <div className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center gap-1 relative`}>
            {/* Remote update pulse indicator */}
            {showRemoteUpdate && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-primary/30 rounded-full pointer-events-none"
                />
            )}

            <motion.button
                className={`btn btn-ghost ${sizeClasses[size].btn} btn-square transition-all ${userVote === 'UP'
                    ? 'text-secondary bg-secondary/10'
                    : 'hover:text-secondary hover:bg-secondary/10'
                    }`}
                onClick={() => handleVote('UP')}
                whileTap={{ scale: 0.9 }}
            >
                <motion.div
                    animate={isAnimating === 'up' ? { y: [-2, 0], scale: [1.2, 1] } : {}}
                >
                    <ArrowUp className={sizeClasses[size].icon} />
                </motion.div>
            </motion.button>

            <AnimatePresence mode="wait">
                <motion.span
                    key={score}
                    initial={{ opacity: 0, y: isAnimating === 'up' ? 10 : -10, scale: showRemoteUpdate ? 1.2 : 1 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: isAnimating === 'down' ? 10 : -10 }}
                    className={`font-bold ${sizeClasses[size].text} min-w-[2.5rem] text-center ${userVote === 'UP' ? 'text-secondary' : userVote === 'DOWN' ? 'text-error' : ''
                        } ${showRemoteUpdate ? 'text-primary' : ''}`}
                >
                    {formatScore(score)}
                </motion.span>
            </AnimatePresence>

            <motion.button
                className={`btn btn-ghost ${sizeClasses[size].btn} btn-square transition-all ${userVote === 'DOWN'
                    ? 'text-error bg-error/10'
                    : 'hover:text-error hover:bg-error/10'
                    }`}
                onClick={() => handleVote('DOWN')}
                whileTap={{ scale: 0.9 }}
            >
                <motion.div
                    animate={isAnimating === 'down' ? { y: [2, 0], scale: [1.2, 1] } : {}}
                >
                    <ArrowDown className={sizeClasses[size].icon} />
                </motion.div>
            </motion.button>

            {/* Live indicator (small dot) */}
            {isConnected && (
                <div className="absolute -top-1 -right-1">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success/50"></span>
                    </span>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

interface PostReactionsProps {
    postId: string;
}

const REACTION_EMOJIS = ['❤️', '😂', '👍', '🔥', '🏆', '💡'];

export default function PostReactions({ postId }: PostReactionsProps) {
    const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
    const [userReaction, setUserReaction] = useState<string | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [reactingEmoji, setReactingEmoji] = useState<string | null>(null);

    // Fetch reactions on mount
    useEffect(() => {
        async function fetchReactions() {
            try {
                const res = await fetch(`/api/posts/${postId}/reactions`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.reactions) setReactionCounts(data.reactions);
                    setUserReaction(data.userReaction || null);
                }
            } catch { /* ignore */ }
        }
        fetchReactions();
    }, [postId]);

    const handleReaction = async (emoji: string) => {
        if (reactingEmoji) return;
        setReactingEmoji(emoji);
        setShowPicker(false);

        const previousReaction = userReaction;
        const previousCounts = { ...reactionCounts };

        // Optimistic update
        if (userReaction === emoji) {
            // Same emoji - remove
            setUserReaction(null);
            setReactionCounts(prev => {
                const newCounts = { ...prev };
                newCounts[emoji] = Math.max(0, (newCounts[emoji] || 1) - 1);
                if (newCounts[emoji] === 0) delete newCounts[emoji];
                return newCounts;
            });
        } else {
            // Different emoji - swap
            if (userReaction) {
                setReactionCounts(prev => {
                    const newCounts = { ...prev };
                    newCounts[userReaction] = Math.max(0, (newCounts[userReaction] || 1) - 1);
                    if (newCounts[userReaction] === 0) delete newCounts[userReaction];
                    newCounts[emoji] = (newCounts[emoji] || 0) + 1;
                    return newCounts;
                });
            } else {
                setReactionCounts(prev => ({
                    ...prev,
                    [emoji]: (prev[emoji] || 0) + 1
                }));
            }
            setUserReaction(emoji);
        }

        try {
            const res = await fetch(`/api/posts/${postId}/reactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emoji })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.reactions) setReactionCounts(data.reactions);
                setUserReaction(data.userReaction || null);
            } else {
                setReactionCounts(previousCounts);
                setUserReaction(previousReaction);
            }
        } catch {
            setReactionCounts(previousCounts);
            setUserReaction(previousReaction);
        } finally {
            setReactingEmoji(null);
        }
    };

    const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Display reaction counts */}
            <AnimatePresence mode="popLayout">
                {Object.entries(reactionCounts)
                    .filter(([, count]) => count > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([emoji, count]) => (
                        <motion.button
                            key={emoji}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleReaction(emoji)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${userReaction === emoji
                                ? 'bg-primary/20 border-2 border-primary/50'
                                : 'bg-base-200 hover:bg-base-300 border-2 border-transparent'
                                }`}
                        >
                            <span className="text-lg">{emoji}</span>
                            <span className="text-xs font-bold">{count}</span>
                        </motion.button>
                    ))}
            </AnimatePresence>

            {/* Add reaction button */}
            <div className="relative">
                <motion.button
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={() => setShowPicker(!showPicker)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Plus className="w-4 h-4" />
                </motion.button>

                {/* Reaction picker */}
                <AnimatePresence>
                    {showPicker && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="absolute bottom-full left-0 mb-2 flex gap-1 bg-base-100 rounded-2xl shadow-2xl border border-base-content/10 p-2 z-20"
                        >
                            {REACTION_EMOJIS.map((emoji, index) => (
                                <motion.button
                                    key={emoji}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.03 } }}
                                    whileHover={{ scale: 1.4, y: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleReaction(emoji)}
                                    disabled={reactingEmoji === emoji}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors ${userReaction === emoji
                                        ? 'bg-primary/20 ring-2 ring-primary'
                                        : 'hover:bg-base-200'
                                        } ${reactingEmoji === emoji ? 'animate-pulse' : ''}`}
                                >
                                    {emoji}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Total reactions count */}
            {totalReactions > 0 && (
                <span className="text-xs text-base-content/50">
                    {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
                </span>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp,
    ArrowDown,
    MessageSquare,
    Share2,
    ShieldCheck,
    Pin,
    Lock,
    AlertTriangle,
    ExternalLink,
    Copy,
    Check,
} from 'lucide-react';
import PostSettingsDropdown from '@/components/Post/PostSettingsDropdown';

interface PostCardProps {
    postId: string;
    score: number;
    subreddit: string;
    communitySlug?: string;
    author: string;
    authorId?: string;
    time: string;
    title: string;
    content: string;
    type?: string;
    url?: string;
    hasImage?: boolean;
    imageUrl?: string;
    commentCount: number;
    insightScore?: number;
    isVerified?: boolean;
    isPinned?: boolean;
    isLocked?: boolean;
    isNSFW?: boolean;
    modActions?: React.ReactNode;
    initialVote?: 'UP' | 'DOWN' | null;
}

const REACTION_EMOJIS = ['❤️', '😂', '👍', '🔥', '🏆'];

export default function PostCard({
    postId,
    score: initialScore,
    subreddit,
    communitySlug,
    author,
    authorId,
    time,
    title,
    content,
    type = 'text',
    url,
    hasImage,
    imageUrl,
    commentCount,
    isVerified,
    isPinned,
    isLocked,
    isNSFW,
    modActions,
    initialVote = null,
}: PostCardProps) {
    const [score, setScore] = useState(initialScore);
    const [currentVote, setCurrentVote] = useState<'UP' | 'DOWN' | null>(initialVote);
    const [voting, setVoting] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    // Reactions state
    const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
    const [userReaction, setUserReaction] = useState<string | null>(null);
    const [showReactions, setShowReactions] = useState(false);
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

    const handleVote = async (voteType: 'UP' | 'DOWN') => {
        if (voting) return;
        setVoting(true);

        const previousVote = currentVote;
        const previousScore = score;

        if (currentVote === voteType) {
            setCurrentVote(null);
            setScore(prev => prev + (voteType === 'UP' ? -1 : 1));
        } else {
            setCurrentVote(voteType);
            if (previousVote === null) {
                setScore(prev => prev + (voteType === 'UP' ? 1 : -1));
            } else {
                setScore(prev => prev + (voteType === 'UP' ? 2 : -2));
            }
        }

        try {
            const res = await fetch(`/api/posts/${postId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: voteType }),
            });

            if (!res.ok) {
                setCurrentVote(previousVote);
                setScore(previousScore);
            }
        } catch {
            setCurrentVote(previousVote);
            setScore(previousScore);
        } finally {
            setVoting(false);
        }
    };

    const handleReaction = async (emoji: string) => {
        if (reactingEmoji) return;
        setReactingEmoji(emoji);
        setShowReactions(false);

        const previousReaction = userReaction;
        const previousCounts = { ...reactionCounts };

        // Optimistic update
        if (userReaction === emoji) {
            setUserReaction(null);
            setReactionCounts(prev => {
                const newCounts = { ...prev };
                newCounts[emoji] = Math.max(0, (newCounts[emoji] || 1) - 1);
                if (newCounts[emoji] === 0) delete newCounts[emoji];
                return newCounts;
            });
        } else {
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

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
            setShowShareMenu(false);
        }, 1500);
    };

    const formatScore = (s: number): string => {
        if (s >= 1000) return `${(s / 1000).toFixed(1)}k`;
        return s.toString();
    };

    const slug = communitySlug || subreddit.replace('r/', '');
    const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card bg-base-100 shadow-lg border transition-all duration-300 hover:shadow-xl ${isPinned
                ? 'border-primary/40 bg-gradient-to-r from-primary/5 to-transparent'
                : 'border-base-content/5 hover:border-primary/30'
                }`}
        >
            <div className="card-body p-0 flex-row">

                {/* Vote Column - Desktop */}
                <div className="hidden sm:flex flex-col items-center gap-0.5 p-3 bg-base-200/30 rounded-l-2xl min-w-[3rem]">
                    <motion.button
                        onClick={() => handleVote('UP')}
                        disabled={voting}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`btn btn-ghost btn-xs btn-circle ${currentVote === 'UP'
                            ? 'text-success bg-success/10'
                            : 'hover:text-success hover:bg-success/10'
                            }`}
                    >
                        <ArrowUp className={`w-5 h-5 ${currentVote === 'UP' ? 'fill-current' : ''}`} />
                    </motion.button>

                    <motion.span
                        key={score}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className={`font-bold text-sm py-1 ${currentVote === 'UP' ? 'text-success' :
                            currentVote === 'DOWN' ? 'text-error' : ''
                            }`}
                    >
                        {formatScore(score)}
                    </motion.span>

                    <motion.button
                        onClick={() => handleVote('DOWN')}
                        disabled={voting}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`btn btn-ghost btn-xs btn-circle ${currentVote === 'DOWN'
                            ? 'text-error bg-error/10'
                            : 'hover:text-error hover:bg-error/10'
                            }`}
                    >
                        <ArrowDown className={`w-5 h-5 ${currentVote === 'DOWN' ? 'fill-current' : ''}`} />
                    </motion.button>
                </div>

                {/* Content Column */}
                <div className="flex-1 p-4 sm:pl-3">
                    {/* Status Badges */}
                    {(isPinned || isLocked || isNSFW) && (
                        <div className="flex items-center gap-2 mb-2">
                            {isPinned && (
                                <span className="badge badge-primary badge-sm gap-1">
                                    <Pin className="w-3 h-3" /> Pinned
                                </span>
                            )}
                            {isLocked && (
                                <span className="badge badge-warning badge-sm gap-1">
                                    <Lock className="w-3 h-3" /> Locked
                                </span>
                            )}
                            {isNSFW && (
                                <span className="badge badge-error badge-sm gap-1">
                                    <AlertTriangle className="w-3 h-3" /> NSFW
                                </span>
                            )}
                        </div>
                    )}

                    {/* Metadata Row */}
                    <div className="flex items-center gap-2 mb-2 text-xs text-base-content/60 flex-wrap">
                        {isVerified && (
                            <span className="badge badge-success badge-outline badge-sm gap-1">
                                <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                        )}
                        <Link
                            href={`/community/r/${slug}`}
                            className="font-semibold text-base-content hover:text-primary transition-colors"
                        >
                            r/{slug}
                        </Link>
                        <span className="opacity-50">•</span>
                        <Link
                            href={`/u/${author}`}
                            className="hover:text-primary transition-colors"
                        >
                            u/{author}
                        </Link>
                        <span className="opacity-50">•</span>
                        <span>{time}</span>

                        {modActions && (
                            <div className="ml-auto">
                                {modActions}
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <Link href={`/post/${postId}`}>
                        <h2 className="text-lg font-bold mb-2 hover:text-primary transition-colors leading-snug line-clamp-2">
                            {title}
                        </h2>
                    </Link>

                    {/* Content with NSFW blur */}
                    <div className={isNSFW ? 'blur-sm hover:blur-none transition-all' : ''}>
                        {content && (
                            <p className="text-base-content/70 text-sm mb-3 line-clamp-3">
                                {content}
                            </p>
                        )}

                        {type === 'link' && url && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-base-200/50 rounded-xl mb-3 hover:bg-base-200 transition-colors group"
                            >
                                <ExternalLink className="w-4 h-4 text-primary" />
                                <span className="text-sm text-primary truncate flex-1 group-hover:underline">
                                    {new URL(url).hostname}
                                </span>
                            </a>
                        )}

                        {(hasImage || type === 'image') && imageUrl && (
                            <Link href={`/post/${postId}`}>
                                <figure className="relative w-full max-h-96 rounded-xl overflow-hidden mb-3 bg-base-200">
                                    <img
                                        src={imageUrl}
                                        alt={title}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </figure>
                            </Link>
                        )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {/* Mobile Vote */}
                        <div className="flex sm:hidden items-center gap-1 mr-2">
                            <button
                                onClick={() => handleVote('UP')}
                                className={`btn btn-ghost btn-xs btn-circle ${currentVote === 'UP' ? 'text-success' : ''}`}
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                            <span className={`text-sm font-bold ${currentVote === 'UP' ? 'text-success' :
                                currentVote === 'DOWN' ? 'text-error' : ''
                                }`}>
                                {formatScore(score)}
                            </span>
                            <button
                                onClick={() => handleVote('DOWN')}
                                className={`btn btn-ghost btn-xs btn-circle ${currentVote === 'DOWN' ? 'text-error' : ''}`}
                            >
                                <ArrowDown className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Reaction Counts */}
                        <AnimatePresence mode="wait">
                            {totalReactions > 0 && (
                                <motion.div
                                    key="reactions"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-0.5 px-2 py-1 bg-base-content/5 border border-base-content/10 rounded-full"
                                >
                                    {Object.entries(reactionCounts)
                                        .filter(([, count]) => count > 0)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 3)
                                        .map(([emoji]) => (
                                            <motion.span
                                                key={emoji}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-sm"
                                            >
                                                {emoji}
                                            </motion.span>
                                        ))}
                                    <span className="text-xs font-bold text-base-content/60 ml-1">
                                        {totalReactions}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* User's Reaction */}
                        {userReaction && (
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleReaction(userReaction)}
                                className="flex items-center justify-center h-8 px-2 rounded-lg hover:bg-base-content/10 transition-colors"
                                title="Click to remove"
                            >
                                <span className="text-base">{userReaction}</span>
                            </motion.button>
                        )}

                        {/* Reactions Picker */}
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center justify-center h-8 px-2 rounded-lg hover:bg-base-content/10 transition-colors"
                                onClick={() => setShowReactions(!showReactions)}
                            >
                                <span className="text-base">{userReaction ? '✨' : '😀'}</span>
                            </motion.button>

                            <AnimatePresence>
                                {showReactions && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        className="absolute left-0 bottom-full mb-2 flex gap-1 bg-base-100 rounded-full shadow-2xl border border-base-content/10 p-1.5 z-20"
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
                                                className={`w-9 h-9 rounded-full flex items-center justify-center text-xl transition-colors
                                                    ${userReaction === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-base-200'}
                                                    ${reactingEmoji === emoji ? 'animate-pulse' : ''}
                                                `}
                                            >
                                                {emoji}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Comments */}
                        <Link
                            href={`/post/${postId}`}
                            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm hover:bg-base-content/10 transition-colors ${isLocked ? 'text-warning' : 'text-base-content/70 hover:text-base-content'}`}
                        >
                            {isLocked ? <Lock className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                            <span className="hidden xs:inline">
                                {isLocked ? 'Locked' : `${commentCount} Comments`}
                            </span>
                            <span className="xs:hidden">{commentCount}</span>
                        </Link>

                        {/* Share */}
                        <div className="relative">
                            <button
                                onClick={() => setShowShareMenu(!showShareMenu)}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm text-base-content/70 hover:text-base-content hover:bg-base-content/10 transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="hidden xs:inline">Share</span>
                            </button>

                            <AnimatePresence>
                                {showShareMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute bottom-full left-0 mb-2 bg-base-100 rounded-xl shadow-xl border border-base-content/10 p-2 min-w-[140px] z-50"
                                    >
                                        <button
                                            onClick={handleCopyLink}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-base-200 text-sm"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-4 h-4 text-success" />
                                                    <span className="text-success">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    <span>Copy link</span>
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Settings Dropdown */}
                        <div className="ml-auto">
                            <PostSettingsDropdown
                                postId={postId}
                                authorId={authorId || ''}
                                communitySlug={slug}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

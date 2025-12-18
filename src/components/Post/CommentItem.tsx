'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, MessageSquare, MoreHorizontal, Flag, X, AlertTriangle, Check, Loader2 } from 'lucide-react';
import CommentComposer from './CommentComposer';
import { DisagreementBadge, DisagreementMicrocopy } from '@/components/Comments/DisagreementUI';
import MentionText from '@/components/Mention/MentionText';

interface CommentItemProps {
    id: string;
    postId: string;
    author: {
        username: string;
        reputation: number;
        image?: string | null;
        hasPostedFirstComment?: boolean;
    };
    content: string;
    score: number;
    createdAt: Date;
    children?: CommentItemProps[];
    depth?: number;
    onReplySuccess?: () => void;
    isNewVoice?: boolean; // First comment ever on Resonate
    isDisagreement?: boolean; // Detected as good-faith disagreement
    isFirstDisagreementReceived?: boolean; // First time user received disagreement
    isNewSinceLastVisit?: boolean; // Comment added since user's last visit (resume feature)
}

const REACTION_EMOJIS = ['❤️', '😂', '👍', '🔥', '🏆'];

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

function formatScore(score: number): string {
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
    return score.toString();
}

export default function CommentItem({
    id,
    postId,
    author,
    content,
    score: initialScore,
    createdAt,
    children = [],
    depth = 0,
    onReplySuccess,
    isNewVoice = false,
    isDisagreement = false,
    isFirstDisagreementReceived = false,
    isNewSinceLastVisit = false
}: CommentItemProps) {
    const [showReply, setShowReply] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Report state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [reporting, setReporting] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [reportError, setReportError] = useState('');

    // Voting state
    const [score, setScore] = useState(initialScore);
    const [userVote, setUserVote] = useState<'UP' | 'DOWN' | null>(null);
    const [voting, setVoting] = useState(false);

    // Reactions state - single reaction per user
    const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
    const [userReaction, setUserReaction] = useState<string | null>(null);
    const [reactingEmoji, setReactingEmoji] = useState<string | null>(null);

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleReport = async () => {
        if (!reportReason) {
            setReportError('Please select a reason');
            return;
        }
        setReporting(true);
        setReportError('');
        try {
            const res = await fetch(`/api/comments/${id}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reportReason, details: reportDetails }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to report');
            }
            setReportSuccess(true);
            setTimeout(() => {
                setShowReportModal(false);
                setReportSuccess(false);
                setReportReason('');
                setReportDetails('');
            }, 2000);
        } catch (err: any) {
            setReportError(err.message);
        } finally {
            setReporting(false);
        }
    };

    // Fetch reactions on mount
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch vote
                const voteRes = await fetch(`/api/comments/${id}/vote`);
                if (voteRes.ok) {
                    const voteData = await voteRes.json();
                    setUserVote(voteData.userVote);
                }

                // Fetch reactions
                const reactRes = await fetch(`/api/comments/${id}/reactions`);
                if (reactRes.ok) {
                    const reactData = await reactRes.json();
                    if (reactData.reactions) {
                        setReactionCounts(reactData.reactions);
                    }
                    // Single reaction, not array
                    setUserReaction(reactData.userReaction || null);
                }
            } catch (error) {
                console.error('Error fetching comment data:', error);
            }
        }
        fetchData();
    }, [id]);

    const handleVote = async (type: 'UP' | 'DOWN') => {
        if (voting) return;

        setVoting(true);
        const previousScore = score;
        const previousVote = userVote;

        if (userVote === type) {
            setUserVote(null);
            setScore(score + (type === 'UP' ? -1 : 1));
        } else if (userVote) {
            setUserVote(type);
            setScore(score + (type === 'UP' ? 2 : -2));
        } else {
            setUserVote(type);
            setScore(score + (type === 'UP' ? 1 : -1));
        }

        try {
            const res = await fetch(`/api/comments/${id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });

            if (res.ok) {
                const data = await res.json();
                setScore(data.score);
                setUserVote(data.userVote);
            } else {
                setScore(previousScore);
                setUserVote(previousVote);
            }
        } catch {
            setScore(previousScore);
            setUserVote(previousVote);
        } finally {
            setVoting(false);
        }
    };

    const handleReaction = async (emoji: string) => {
        if (reactingEmoji) return;

        setReactingEmoji(emoji);
        setShowReactions(false);

        // Optimistic update for single reaction
        const previousReaction = userReaction;
        const previousCounts = { ...reactionCounts };

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
                // Remove old reaction count
                setReactionCounts(prev => {
                    const newCounts = { ...prev };
                    newCounts[userReaction] = Math.max(0, (newCounts[userReaction] || 1) - 1);
                    if (newCounts[userReaction] === 0) delete newCounts[userReaction];
                    // Add new reaction count
                    newCounts[emoji] = (newCounts[emoji] || 0) + 1;
                    return newCounts;
                });
            } else {
                // No previous reaction, just add
                setReactionCounts(prev => ({
                    ...prev,
                    [emoji]: (prev[emoji] || 0) + 1
                }));
            }
            setUserReaction(emoji);
        }

        try {
            const res = await fetch(`/api/comments/${id}/reactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emoji })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.reactions && typeof data.reactions === 'object') {
                    setReactionCounts(data.reactions);
                }
                setUserReaction(data.userReaction || null);
            } else {
                // Revert on error
                setReactionCounts(previousCounts);
                setUserReaction(previousReaction);
            }
        } catch (error) {
            console.error('Error reacting:', error);
            setReactionCounts(previousCounts);
            setUserReaction(previousReaction);
        } finally {
            setReactingEmoji(null);
        }
    };

    // Get total reaction count
    const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-base-content/10' : ''} ${isNewSinceLastVisit ? 'relative' : ''}`}
        >
            <div className={`py-3 group ${isNewVoice ? 'relative bg-secondary/5 rounded-lg px-3 -mx-3 ring-1 ring-secondary/30' : ''} ${isNewSinceLastVisit && !isNewVoice ? 'relative bg-cyan-500/5 rounded-lg px-3 -mx-3 border-l-2 border-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]' : ''}`}>
                {/* NEW badge for resume */}
                {isNewSinceLastVisit && !isNewVoice && (
                    <span className="absolute -top-1 -left-1 badge badge-xs badge-info">NEW</span>
                )}
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="avatar placeholder">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-xs">
                            {author.image ? (
                                <img src={author.image} alt={author.username} />
                            ) : (
                                <span>{author.username[0]?.toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm hover:text-primary cursor-pointer">
                            u/{author.username}
                        </span>
                        {isNewVoice && (
                            <span className="badge badge-xs badge-secondary gap-1 animate-pulse">
                                ✨ New Voice
                            </span>
                        )}
                        {isDisagreement && (
                            <DisagreementBadge isFirstDisagreement={isFirstDisagreementReceived} />
                        )}
                        {author.reputation > 100 && (
                            <span className="badge badge-xs badge-primary">Top Contributor</span>
                        )}
                        <span className="text-xs text-base-content/40">•</span>
                        <span className="text-xs text-base-content/40">{formatTimeAgo(createdAt)}</span>
                    </div>
                </div>

                {/* Content */}
                <p className="text-sm text-base-content/90 leading-relaxed mb-2 whitespace-pre-wrap">
                    <MentionText content={content} />
                </p>

                {/* First disagreement microcopy */}
                {isDisagreement && isFirstDisagreementReceived && (
                    <DisagreementMicrocopy />
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 flex-wrap">
                    {/* Vote buttons */}
                    <button
                        onClick={() => handleVote('UP')}
                        disabled={voting}
                        className={`btn btn-ghost btn-xs btn-square transition-all ${userVote === 'UP'
                            ? 'text-secondary bg-secondary/20'
                            : 'hover:text-secondary hover:bg-secondary/10'
                            }`}
                    >
                        <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className={`text-sm font-bold min-w-[2rem] text-center ${userVote === 'UP' ? 'text-secondary' :
                        userVote === 'DOWN' ? 'text-error' : ''
                        }`}>
                        {formatScore(score)}
                    </span>
                    <button
                        onClick={() => handleVote('DOWN')}
                        disabled={voting}
                        className={`btn btn-ghost btn-xs btn-square transition-all ${userVote === 'DOWN'
                            ? 'text-error bg-error/20'
                            : 'hover:text-error hover:bg-error/10'
                            }`}
                    >
                        <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Reaction Counts Display */}
                    <AnimatePresence mode="wait">
                        {totalReactions > 0 && (
                            <motion.div
                                key="reaction-counts"
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                                className="flex items-center gap-0.5 ml-2 px-2 py-1 bg-base-200/60 rounded-full"
                            >
                                <AnimatePresence mode="popLayout">
                                    {Object.entries(reactionCounts)
                                        .filter(([, count]) => count > 0)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 3)
                                        .map(([emoji]) => (
                                            <motion.span
                                                key={emoji}
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0, rotate: 180 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                className="text-sm"
                                            >
                                                {emoji}
                                            </motion.span>
                                        ))}
                                </AnimatePresence>
                                <span className="text-xs font-bold text-base-content/60 ml-1">
                                    {totalReactions}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* User's Current Reaction (shows their pick) */}
                    {userReaction && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleReaction(userReaction)}
                            className="btn btn-ghost btn-xs ml-1 px-2 bg-primary/10 text-primary"
                            title="Click to remove"
                        >
                            <span className="text-base">{userReaction}</span>
                        </motion.button>
                    )}

                    {/* Reactions Picker */}
                    <div className="relative ml-1">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`btn btn-ghost btn-xs gap-1 ${userReaction ? 'hover:bg-warning/10' : 'hover:bg-warning/10'}`}
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
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                transition: { delay: index * 0.03 }
                                            }}
                                            whileHover={{
                                                scale: 1.4,
                                                y: -5,
                                                transition: { type: 'spring', stiffness: 400 }
                                            }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleReaction(emoji)}
                                            disabled={reactingEmoji === emoji}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xl
                                                transition-colors
                                                ${userReaction === emoji
                                                    ? 'bg-primary/20 ring-2 ring-primary'
                                                    : 'hover:bg-base-200'
                                                }
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

                    {/* Reply */}
                    <button
                        className="btn btn-ghost btn-xs gap-1"
                        onClick={() => setShowReply(!showReply)}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-xs">Reply</span>
                    </button>

                    {/* More/Report */}
                    <div className="relative" ref={menuRef}>
                        <button
                            className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 bg-base-100 border border-base-content/10 rounded-lg shadow-xl py-1 z-50 min-w-32"
                                >
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            setShowReportModal(true);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-warning/10 text-warning"
                                    >
                                        <Flag className="w-4 h-4" />
                                        Report
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Reply Composer */}
                {showReply && (
                    <div className="mt-4">
                        <CommentComposer
                            postId={postId}
                            parentId={id}
                            placeholder={`Reply to u/${author.username}...`}
                            autoFocus
                            onSuccess={() => {
                                setShowReply(false);
                                onReplySuccess?.();
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Nested Replies */}
            {children.length > 0 && (
                <div className="space-y-0">
                    {children.map(child => (
                        <CommentItem
                            key={child.id}
                            {...child}
                            postId={postId}
                            depth={depth + 1}
                            onReplySuccess={onReplySuccess}
                        />
                    ))}
                </div>
            )}

            {/* Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                    >
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowReportModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6"
                        >
                            <button
                                className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
                                onClick={() => setShowReportModal(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {reportSuccess ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-8 h-8 text-success" />
                                    </div>
                                    <h3 className="text-xl font-bold">Report Submitted</h3>
                                    <p className="text-base-content/60 mt-2">Thank you for helping keep Resonate safe.</p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-warning" />
                                        Report Comment
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="label text-sm font-medium">Reason</label>
                                            <select
                                                className="select select-bordered w-full"
                                                value={reportReason}
                                                onChange={(e) => setReportReason(e.target.value)}
                                            >
                                                <option value="">Select a reason...</option>
                                                <option value="Hate Speech">Hate Speech</option>
                                                <option value="Harassment">Harassment</option>
                                                <option value="Misinformation">Misinformation</option>
                                                <option value="Spam">Spam</option>
                                                <option value="Violence">Violence</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="label text-sm font-medium">Additional Details (Optional)</label>
                                            <textarea
                                                className="textarea textarea-bordered w-full"
                                                placeholder="Provide more context..."
                                                value={reportDetails}
                                                onChange={(e) => setReportDetails(e.target.value)}
                                                rows={3}
                                            />
                                        </div>

                                        {reportError && (
                                            <div className="text-error text-sm">{reportError}</div>
                                        )}

                                        <button
                                            className="btn btn-warning w-full"
                                            onClick={handleReport}
                                            disabled={reporting}
                                        >
                                            {reporting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Submit Report'
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

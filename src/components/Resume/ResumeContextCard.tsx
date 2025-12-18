'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, ArrowDown, Clock, MessageSquare, X } from 'lucide-react';

// Simple time ago formatting
function formatTimeAgo(date: Date | string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

interface ResumeContextProps {
    postId: string;
    onDismiss?: () => void;
    onJumpToNewest?: () => void;
}

interface ResumeData {
    userLastComment: {
        id: string;
        content: string;
        createdAt: string;
    } | null;
    newRepliesCount: number;
    directReplies: number;
    previewReplies: Array<{
        id: string;
        authorUsername: string;
        authorImage: string | null;
        content: string;
        createdAt: string;
        isDirectReply: boolean;
    }>;
    status: 'active' | 'heated' | 'quiet';
}

export default function ResumeContextCard({ postId, onDismiss, onJumpToNewest }: ResumeContextProps) {
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const fetchResumeContext = async () => {
            try {
                const res = await fetch(`/api/user/resume?limit=10`);
                if (res.ok) {
                    const data = await res.json();
                    // Find this specific post in the resume data
                    const postData = data.conversations?.find(
                        (c: { postId: string }) => c.postId === postId
                    );
                    if (postData) {
                        setResumeData(postData);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch resume context:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchResumeContext();

        // Mark as viewed after a delay
        const timer = setTimeout(() => {
            fetch('/api/user/resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId }),
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [postId]);

    // Auto-dismiss after 10 seconds if not interacted with
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!expanded) {
                setVisible(false);
            }
        }, 10000);

        return () => clearTimeout(timer);
    }, [expanded]);

    const handleDismiss = () => {
        setVisible(false);
        onDismiss?.();
    };

    const getStatusBadge = (status: 'active' | 'heated' | 'quiet') => {
        switch (status) {
            case 'heated':
                return (
                    <span className="badge badge-sm badge-error gap-1">
                        🔴 Heated debate
                    </span>
                );
            case 'active':
                return (
                    <span className="badge badge-sm badge-warning gap-1">
                        🟡 Active discussion
                    </span>
                );
            default:
                return (
                    <span className="badge badge-sm badge-ghost gap-1">
                        💤 Quiet for now
                    </span>
                );
        }
    };

    if (loading || !resumeData || !visible) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="mb-6 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 backdrop-blur-sm overflow-hidden shadow-lg"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-cyan-500/5">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm font-medium text-cyan-600">
                            You last left this conversation here
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(resumeData.status)}
                        <button
                            onClick={handleDismiss}
                            className="btn btn-ghost btn-xs btn-circle"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* User's Last Comment */}
                {resumeData.userLastComment && (
                    <div className="px-4 py-3 border-b border-base-content/5">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="w-full text-left"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-base-content/60">Your comment</span>
                                        <span className="text-[10px] text-base-content/40 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTimeAgo(resumeData.userLastComment.createdAt)}
                                        </span>
                                    </div>
                                    <p className={`text-sm text-base-content/80 ${expanded ? '' : 'line-clamp-2'}`}>
                                        {resumeData.userLastComment.content}
                                    </p>
                                    {resumeData.userLastComment.content.length > 100 && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                                            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                            {expanded ? 'Show less' : 'Show more'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    </div>
                )}

                {/* Since Then Divider */}
                <div className="relative py-3 px-4">
                    <div className="absolute inset-x-4 top-1/2 h-px bg-base-content/10"></div>
                    <div className="relative flex justify-center">
                        <span className="px-3 bg-base-100 text-xs font-medium text-cyan-600 flex items-center gap-2">
                            <ArrowDown className="w-3 h-3" />
                            Since then ({resumeData.newRepliesCount} new replies)
                            {resumeData.directReplies > 0 && (
                                <span className="badge badge-xs badge-primary">
                                    {resumeData.directReplies} to you
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Preview of New Replies */}
                {resumeData.previewReplies.length > 0 && (
                    <div className="px-4 pb-3 space-y-2">
                        {resumeData.previewReplies.slice(0, 2).map((reply) => (
                            <div
                                key={reply.id}
                                className={`flex items-start gap-2 p-2 rounded-lg ${reply.isDirectReply
                                    ? 'bg-primary/10 border-l-2 border-primary'
                                    : 'bg-base-200/50'
                                    }`}
                            >
                                <div className="w-6 h-6 rounded-full bg-base-300 overflow-hidden flex-shrink-0">
                                    {reply.authorImage ? (
                                        <img src={reply.authorImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-base-content/50">
                                            {reply.authorUsername[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">@{reply.authorUsername}</span>
                                        {reply.isDirectReply && (
                                            <span className="text-[10px] text-primary font-medium">replied to you</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-base-content/70 line-clamp-2">
                                        {reply.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Jump to Newest */}
                <div className="px-4 pb-4">
                    <button
                        onClick={onJumpToNewest}
                        className="btn btn-sm btn-primary w-full gap-2"
                    >
                        <ArrowDown className="w-4 h-4" />
                        Jump to newest replies
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

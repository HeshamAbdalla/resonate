'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, Zap, Users, Sparkles, ChevronRight, Info } from 'lucide-react';

interface SignalPostCardProps {
    post: {
        id: string;
        title: string;
        content: string | null;
        createdAt: string;
        score: number;
        signalScore: number;
        signalReasons: string[];
        author: {
            id: string;
            username: string;
            image: string | null;
        };
        community: {
            id: string;
            slug: string;
            name: string;
        };
        _count: {
            comments: number;
        };
        uniqueVoices: number;
        conversationVelocity: number;
        hasCreatorReply: boolean;
        recentParticipants: {
            id: string;
            username: string;
            image: string | null;
        }[];
        previewReplies: {
            author: string;
            content: string;
        }[];
        isDeepThread: boolean;
        isFeatured: boolean;
    };
}

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function SignalPostCard({ post }: SignalPostCardProps) {
    const [showReasons, setShowReasons] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
        >
            <Link href={`/post/${post.id}`}>
                <div className="card bg-base-100 border border-base-content/5 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden">
                    {/* Featured Badge */}
                    {post.isFeatured && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-secondary text-primary-content text-xs font-bold px-3 py-1 rounded-bl-lg">
                            <Sparkles className="w-3 h-3 inline mr-1" />
                            Featured
                        </div>
                    )}

                    <div className="card-body p-4">
                        {/* Header: Community + Voices + Time */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-primary">r/{post.community.slug}</span>

                                {/* Conversation Velocity Indicator */}
                                {post.conversationVelocity >= 3 && (
                                    <span className="badge badge-xs badge-secondary gap-1">
                                        <Zap className="w-2.5 h-2.5" />
                                        Live
                                    </span>
                                )}

                                {/* Deep Thread Badge */}
                                {post.isDeepThread && (
                                    <span className="badge badge-xs badge-accent">Deep Thread</span>
                                )}
                            </div>

                            <span className="text-xs text-base-content/50">{formatTimeAgo(post.createdAt)}</span>
                        </div>

                        {/* Voices + Avatar Stack */}
                        <div className="flex items-center gap-3 mb-3">
                            {/* Avatar Stack */}
                            <div className="flex -space-x-2">
                                {post.recentParticipants.slice(0, 5).map((user, i) => (
                                    <div
                                        key={user.id}
                                        className="w-6 h-6 rounded-full ring-2 ring-base-100 overflow-hidden bg-gradient-to-br from-primary to-secondary"
                                        style={{ zIndex: 5 - i }}
                                        title={user.username}
                                    >
                                        {user.image ? (
                                            <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold">
                                                {user.username[0]?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {post.uniqueVoices > 5 && (
                                    <div className="w-6 h-6 rounded-full ring-2 ring-base-100 bg-base-300 flex items-center justify-center text-[9px] font-bold text-base-content/60">
                                        +{post.uniqueVoices - 5}
                                    </div>
                                )}
                            </div>

                            <span className="text-sm text-base-content/70 flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                <span className="font-bold">{post.uniqueVoices}</span> voices
                            </span>

                            {post.hasCreatorReply && (
                                <span className="badge badge-xs badge-outline badge-primary">Creator Active</span>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                        </h3>

                        {/* Preview Replies - Conversational Style */}
                        {post.previewReplies.length > 0 && (
                            <div className="bg-base-200/50 rounded-lg p-3 mb-3 space-y-2">
                                {post.previewReplies.slice(0, 2).map((reply, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <MessageCircle className="w-3.5 h-3.5 mt-1 text-base-content/40 flex-shrink-0" />
                                        <p className="text-sm text-base-content/80">
                                            <span className="font-bold text-base-content">{reply.author}:</span>{' '}
                                            "{reply.content}"
                                        </p>
                                    </div>
                                ))}
                                {post._count.comments > 2 && (
                                    <p className="text-xs text-base-content/50 pl-5">
                                        +{post._count.comments - 2} more replies
                                    </p>
                                )}
                            </div>
                        )}

                        {/* CTA: Continue this conversation */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                                Continue this conversation
                                <ChevronRight className="w-4 h-4" />
                            </span>

                            {/* Why This Is Here - Tooltip Trigger */}
                            {post.signalReasons.length > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowReasons(!showReasons);
                                    }}
                                    className="btn btn-ghost btn-xs gap-1 text-base-content/50 hover:text-primary"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                    Why?
                                </button>
                            )}
                        </div>

                        {/* Signal Reasons Tooltip */}
                        {showReasons && post.signalReasons.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"
                            >
                                <p className="text-xs font-bold text-primary mb-2">Why this conversation is trending:</p>
                                <ul className="text-xs text-base-content/70 space-y-1">
                                    {post.signalReasons.map((reason, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

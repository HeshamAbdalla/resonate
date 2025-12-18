'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MessageSquare, Sparkles, Radio, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import CommentComposer from './CommentComposer';
import CommentItem from './CommentItem';
import { useRealtimeComments } from '@/hooks/useRealtimeComments';

interface Comment {
    id: string;
    content: string;
    score: number;
    createdAt: Date;
    author: {
        username: string;
        reputation: number;
        image?: string | null;
    };
    children?: Comment[];
}

interface CommentsListProps {
    postId: string;
    initialCommentCount: number;
}

export default function CommentsList({ postId, initialCommentCount }: CommentsListProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewCommentsBanner, setShowNewCommentsBanner] = useState(false);

    // Real-time comment updates
    const { isConnected, newCommentsCount, hasNewComments, clearNewComments } = useRealtimeComments({
        postId,
        onNewComment: useCallback(() => {
            // Show banner when new comments arrive
            setShowNewCommentsBanner(true);
        }, []),
    });

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`/api/posts/${postId}/comments`);
            const data = await res.json();
            setComments(data.comments || []);
            setShowNewCommentsBanner(false);
            clearNewComments();
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    }, [postId, clearNewComments]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleCommentSuccess = () => {
        fetchComments();
    };

    const handleLoadNewComments = () => {
        fetchComments();
    };

    return (
        <div className="space-y-6">
            {/* Comment Composer */}
            <CommentComposer
                postId={postId}
                onSuccess={handleCommentSuccess}
                placeholder="What are your thoughts?"
            />

            {/* Comments Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">
                        {comments.length > 0 ? comments.length : initialCommentCount} Comments
                    </h3>
                    {/* Realtime connection status */}
                    <span className={`badge badge-xs gap-1 ${isConnected ? 'badge-success' : 'badge-ghost'}`}>
                        {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                        {isConnected ? 'Live' : 'Offline'}
                    </span>
                </div>

                {/* Manual refresh button */}
                <button
                    onClick={fetchComments}
                    className="btn btn-ghost btn-xs gap-1"
                    disabled={loading}
                >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* New Comments Banner */}
            <AnimatePresence>
                {showNewCommentsBanner && hasNewComments && (
                    <motion.button
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        onClick={handleLoadNewComments}
                        className="w-full py-3 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span className="font-medium">
                            {newCommentsCount} new {newCommentsCount === 1 ? 'comment' : 'comments'} — Click to load
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Comments List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : comments.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 bg-base-200/30 rounded-2xl"
                >
                    <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                    <p className="text-base-content/60 font-medium">No comments yet</p>
                    <p className="text-sm text-base-content/40">Be the first to share your thoughts!</p>
                    {isConnected && (
                        <p className="text-xs text-success mt-2 flex items-center justify-center gap-1">
                            <Radio className="w-3 h-3" />
                            Comments will appear instantly when posted
                        </p>
                    )}
                </motion.div>
            ) : (
                <AnimatePresence>
                    <div className="divide-y divide-base-content/5">
                        {comments.map((comment, index) => (
                            <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <CommentItem
                                    id={comment.id}
                                    postId={postId}
                                    author={comment.author}
                                    content={comment.content}
                                    score={comment.score}
                                    createdAt={comment.createdAt}
                                    children={comment.children?.map(c => ({ ...c, postId })) as any}
                                    onReplySuccess={handleCommentSuccess}
                                />
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
}

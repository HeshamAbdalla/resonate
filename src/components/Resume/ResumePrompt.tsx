'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bookmark, BellOff, X, Check } from 'lucide-react';

interface ResumePromptProps {
    postId: string;
    onReply?: () => void;
    onFollow?: () => void;
    onMute?: () => void;
    onDismiss?: () => void;
}

export default function ResumePrompt({
    postId,
    onReply,
    onFollow,
    onMute,
    onDismiss
}: ResumePromptProps) {
    const [visible, setVisible] = useState(true);
    const [following, setFollowing] = useState(false);
    const [muting, setMuting] = useState(false);
    const [actionTaken, setActionTaken] = useState<'followed' | 'muted' | null>(null);

    const handleFollow = async () => {
        setFollowing(true);
        try {
            const res = await fetch(`/api/posts/${postId}/follow`, {
                method: 'POST',
            });
            if (res.ok) {
                setActionTaken('followed');
                onFollow?.();
                // Auto-dismiss after showing success
                setTimeout(() => setVisible(false), 2000);
            }
        } catch (e) {
            console.error('Failed to follow:', e);
        } finally {
            setFollowing(false);
        }
    };

    const handleMute = async () => {
        setMuting(true);
        try {
            // For now, mute is just unfollowing
            const res = await fetch(`/api/posts/${postId}/follow`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setActionTaken('muted');
                onMute?.();
                setTimeout(() => setVisible(false), 2000);
            }
        } catch (e) {
            console.error('Failed to mute:', e);
        } finally {
            setMuting(false);
        }
    };

    const handleDismiss = () => {
        setVisible(false);
        onDismiss?.();
    };

    if (!visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md"
            >
                <div className="bg-base-100/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-base-content/10 p-4">
                    {actionTaken ? (
                        // Success State
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center gap-3 py-2"
                        >
                            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-success" />
                            </div>
                            <span className="text-sm font-medium">
                                {actionTaken === 'followed'
                                    ? "You'll see this here when it's active again"
                                    : "Conversation muted"}
                            </span>
                        </motion.div>
                    ) : (
                        // Prompt State
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-base-content/80">
                                    Want to continue this conversation?
                                </span>
                                <button
                                    onClick={handleDismiss}
                                    className="btn btn-ghost btn-xs btn-circle"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        onReply?.();
                                        setVisible(false);
                                    }}
                                    className="btn btn-primary btn-sm flex-1 gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Reply
                                </button>

                                <button
                                    onClick={handleFollow}
                                    disabled={following}
                                    className="btn btn-ghost btn-sm flex-1 gap-2 border border-base-content/10"
                                >
                                    {following ? (
                                        <span className="loading loading-spinner loading-xs" />
                                    ) : (
                                        <Bookmark className="w-4 h-4" />
                                    )}
                                    Follow
                                </button>

                                <button
                                    onClick={handleMute}
                                    disabled={muting}
                                    className="btn btn-ghost btn-sm gap-2 text-base-content/50 hover:text-error hover:bg-error/10"
                                >
                                    {muting ? (
                                        <span className="loading loading-spinner loading-xs" />
                                    ) : (
                                        <BellOff className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">Mute</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Exit Toast - shown when user replies or leaves
export function ExitConfirmationToast({ message = "You'll see this here when it's active again" }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
            <div className="bg-base-100/95 backdrop-blur-xl rounded-full shadow-xl border border-base-content/10 px-4 py-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span className="text-sm">{message}</span>
            </div>
        </motion.div>
    );
}

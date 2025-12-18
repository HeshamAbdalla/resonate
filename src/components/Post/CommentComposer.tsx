'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Smile, AtSign, Bold, Italic, Link as LinkIcon, MessageCircle, Star, Share2 } from 'lucide-react';
import { detectAggressiveLanguage } from '@/lib/disagreement';
import { AggressionNudge } from '@/components/Comments/DisagreementUI';
import MentionTextarea, { MentionTextareaRef } from '@/components/Mention/MentionTextarea';

interface CommentComposerProps {
    postId: string;
    parentId?: string;
    onSuccess?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
    isReplyToDisagreement?: boolean; // When replying to a disagreeing comment
}

export default function CommentComposer({
    postId,
    parentId,
    onSuccess,
    placeholder,
    autoFocus = false,
    isReplyToDisagreement = false
}: CommentComposerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<MentionTextareaRef>(null);
    const [content, setContent] = useState('');
    const [expanded, setExpanded] = useState(autoFocus);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [justPosted, setJustPosted] = useState(false);
    const [isFirstComment, setIsFirstComment] = useState(false);
    const [aggressionWarning, setAggressionWarning] = useState<string | null>(null);

    // Determine placeholder based on context
    const defaultPlaceholder = isReplyToDisagreement
        ? "What part do you see differently?"
        : "What's your take?";
    const actualPlaceholder = placeholder || defaultPlaceholder;

    // Check for aggressive language as user types
    useEffect(() => {
        if (content.length > 20) {
            const result = detectAggressiveLanguage(content);
            if (result.hasAggression && result.suggestions.length > 0) {
                setAggressionWarning(result.suggestions[0]);
            } else {
                setAggressionWarning(null);
            }
        } else {
            setAggressionWarning(null);
        }
    }, [content]);

    const handleSubmit = async () => {
        if (!content.trim() || posting) return;

        setPosting(true);
        setError('');

        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content.trim(),
                    parentId: parentId || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to post comment');
            }

            const data = await res.json();

            // Check if this was their first comment ever
            setIsFirstComment(data.isFirstComment || false);

            setContent('');
            setJustPosted(true);

            // Show confirmation for 5 seconds
            setTimeout(() => {
                setJustPosted(false);
                setExpanded(false);
            }, 5000);

            onSuccess?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPosting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleFocus = () => {
        setExpanded(true);
    };

    const handleMentionClick = () => {
        textareaRef.current?.insertMentionTrigger();
    };

    // Keep expanded if there's content or just posted
    const isExpanded = expanded || content.length > 0 || justPosted;

    return (
        <div className="space-y-2">
            {/* Label */}
            {!parentId && (
                <h3 className="text-sm font-bold text-base-content/80 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Add your voice
                </h3>
            )}

            <motion.div
                ref={containerRef}
                className={`bg-base-100 rounded-xl border transition-all ${isExpanded ? 'border-primary shadow-lg' : 'border-base-content/10'
                    }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Post-comment confirmation */}
                <AnimatePresence>
                    {justPosted && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-b border-primary/20 bg-primary/5 p-4"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">🧵</span>
                                <div>
                                    <p className="font-bold text-base-content">You joined the conversation</p>
                                    <p className="text-sm text-base-content/60">
                                        Conversations grow when more voices join.
                                    </p>
                                </div>
                            </div>

                            {/* Post-comment actions */}
                            <div className="flex gap-2 mt-3">
                                <button className="btn btn-sm btn-ghost gap-2">
                                    <Star className="w-4 h-4" />
                                    Follow this conversation
                                </button>
                                <button className="btn btn-sm btn-ghost gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Invite someone
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!justPosted && (
                    <>
                        {/* Disagreement-aware guidance (above text area) */}
                        {isReplyToDisagreement && isExpanded && (
                            <div className="px-4 pt-3 pb-1 text-xs text-info flex items-center gap-2">
                                <span>💡</span>
                                <span>Address the idea, not the person.</span>
                            </div>
                        )}

                        <MentionTextarea
                            ref={textareaRef}
                            value={content}
                            onChange={setContent}
                            onFocus={handleFocus}
                            onKeyDown={handleKeyDown}
                            placeholder={actualPlaceholder}
                            autoFocus={autoFocus}
                            className="textarea w-full bg-transparent resize-none border-none focus:outline-none p-4 min-h-[80px]"
                            rows={isExpanded ? 4 : 2}
                        />

                        {/* Aggression nudge (soft, non-blocking) */}
                        <AnimatePresence>
                            {aggressionWarning && (
                                <div className="px-4 pb-2">
                                    <AggressionNudge message={aggressionWarning} />
                                </div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-base-content/10"
                                >
                                    {/* Guidance text */}
                                    <div className="px-4 pt-2">
                                        <p className="text-xs text-base-content/40">
                                            Good conversations welcome different perspectives. Type <span className="text-primary font-medium">@</span> to mention someone.
                                        </p>
                                    </div>

                                    <div className="p-3 flex justify-between items-center">
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs btn-square"
                                                onMouseDown={(e) => e.preventDefault()}
                                            >
                                                <Bold className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs btn-square"
                                                onMouseDown={(e) => e.preventDefault()}
                                            >
                                                <Italic className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs btn-square"
                                                onMouseDown={(e) => e.preventDefault()}
                                            >
                                                <LinkIcon className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs btn-square"
                                                onMouseDown={(e) => e.preventDefault()}
                                            >
                                                <Smile className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs btn-square text-primary"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={handleMentionClick}
                                                title="Mention someone (@)"
                                            >
                                                <AtSign className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-base-content/40 hidden sm:inline">
                                                ⌘+Enter to submit
                                            </span>
                                            <button
                                                type="button"
                                                className={`btn btn-sm gap-2 ${content.trim() ? 'btn-primary' : 'btn-disabled'}`}
                                                onClick={handleSubmit}
                                                disabled={!content.trim() || posting}
                                            >
                                                {posting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Add Voice
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {error && (
                    <div className="px-4 pb-4">
                        <div className="text-error text-sm">{error}</div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquarePlus, Lightbulb, X, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationStarterProps {
    communityId?: string;
    communitySlug?: string;
    communityName?: string;
}

const PROMPTS = [
    { prefix: "What's your take on", placeholder: "a controversial topic..." },
    { prefix: "I don't agree with the common view on", placeholder: "something widely accepted..." },
    { prefix: "Can someone explain why", placeholder: "something confusing happens..." },
    { prefix: "What would happen if", placeholder: "a hypothetical scenario..." },
    { prefix: "Unpopular opinion:", placeholder: "your honest thought..." },
    { prefix: "Change my mind:", placeholder: "a position you're open to reconsidering..." },
];

export default function ConversationStarter({
    communityId,
    communitySlug,
    communityName,
}: ConversationStarterProps) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState<typeof PROMPTS[0] | null>(null);
    const [content, setContent] = useState('');
    const [showPrompts, setShowPrompts] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    const handlePost = async () => {
        if (!content.trim()) return;

        setIsPosting(true);
        try {
            const title = selectedPrompt
                ? `${selectedPrompt.prefix} ${content}`
                : content;

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content: '', // Title is the conversation starter
                    type: 'text',
                    communityId,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/post/${data.id}`);
            }
        } catch (error) {
            console.error('Failed to post:', error);
        } finally {
            setIsPosting(false);
        }
    };

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="w-full card bg-base-100 border border-base-content/10 hover:border-primary/30 transition-all p-4 text-left group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                        <MessageSquarePlus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-base-content/80 group-hover:text-primary transition-colors">
                            Start a Conversation
                        </p>
                        <p className="text-xs text-base-content/50">
                            Great conversations invite multiple viewpoints
                        </p>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 80 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="card bg-base-100 border border-primary/30 shadow-lg overflow-hidden"
        >
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                        <MessageSquarePlus className="w-5 h-5 text-primary" />
                        Start a Conversation
                    </h3>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="btn btn-ghost btn-sm btn-square"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Community Tag */}
                {communitySlug && (
                    <div className="badge badge-primary badge-outline mb-3">
                        r/{communitySlug}
                    </div>
                )}

                {/* Prompt Selector */}
                <div className="relative mb-3">
                    <button
                        onClick={() => setShowPrompts(!showPrompts)}
                        className="btn btn-ghost btn-sm gap-2 text-base-content/70"
                    >
                        <Lightbulb className="w-4 h-4" />
                        {selectedPrompt ? selectedPrompt.prefix : 'Choose a conversation starter...'}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showPrompts ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showPrompts && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 mt-1 bg-base-100 border border-base-content/10 rounded-lg shadow-lg z-10 w-full max-w-md"
                            >
                                {PROMPTS.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setSelectedPrompt(prompt);
                                            setShowPrompts(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-base-200 first:rounded-t-lg last:rounded-b-lg text-sm"
                                    >
                                        <span className="font-medium">{prompt.prefix}</span>
                                        <span className="text-base-content/50"> {prompt.placeholder}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        setSelectedPrompt(null);
                                        setShowPrompts(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-base-200 rounded-b-lg text-sm text-base-content/60 border-t border-base-content/5"
                                >
                                    Or write your own...
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input */}
                <div className="relative">
                    {selectedPrompt && (
                        <span className="absolute left-3 top-3 text-base-content/50 text-sm pointer-events-none">
                            {selectedPrompt.prefix}
                        </span>
                    )}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={selectedPrompt ? selectedPrompt.placeholder : "What's on your mind?"}
                        className={`textarea textarea-bordered w-full min-h-[100px] ${selectedPrompt ? 'pt-8' : ''}`}
                    />
                </div>

                {/* Guidance */}
                <p className="text-xs text-base-content/50 mt-2 flex items-center gap-2">
                    <Lightbulb className="w-3 h-3" />
                    Great conversations invite multiple viewpoints
                </p>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="btn btn-ghost btn-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePost}
                        disabled={!content.trim() || isPosting}
                        className="btn btn-primary btn-sm gap-2"
                    >
                        {isPosting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            'Start Conversation'
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

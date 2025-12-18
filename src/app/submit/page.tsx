'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Image as ImageIcon,
    Link as LinkIcon,
    Type,
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Upload,
    X,
    ExternalLink,
    Wand2,
    Send
} from 'lucide-react';
import CommunitySelector from '@/components/Post/CommunitySelector';

function SubmitPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCommunity = searchParams.get('community') || undefined;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [activeTab, setActiveTab] = useState<'text' | 'image' | 'link'>('text');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [url, setUrl] = useState('');
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

    // State management
    const [posting, setPosting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [createdPostSlug, setCreatedPostSlug] = useState('');

    // Character counts
    const titleMaxChars = 300;
    const bodyMaxChars = 40000;

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.max(200, textareaRef.current.scrollHeight)}px`;
        }
    }, [body]);

    const canSubmit = title.trim().length >= 3 && selectedCommunityId && !posting;

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setPosting(true);
        setError('');

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    content: activeTab === 'text' ? body.trim() : null,
                    type: activeTab,
                    url: activeTab === 'link' ? url.trim() : null,
                    communityId: selectedCommunityId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create post');
            }

            setSuccess(true);
            setCreatedPostSlug(data.communitySlug);

            // Redirect after success animation
            setTimeout(() => {
                router.push(`/community/r/${data.communitySlug}`);
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPosting(false);
        }
    };

    // Success overlay
    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle2 className="w-12 h-12 text-success" />
                    </motion.div>
                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl font-black mb-2"
                    >
                        Post Created! 🎉
                    </motion.h2>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-base-content/60"
                    >
                        Redirecting to r/{createdPostSlug}...
                    </motion.p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex gap-8 justify-center items-start flex-wrap lg:flex-nowrap">
            <motion.div
                className="w-full max-w-3xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black tracking-tight">
                        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Create a Post
                        </span>
                    </h1>
                    <div className="badge badge-primary badge-outline gap-2">
                        <Wand2 className="w-3 h-3" />
                        AI-Enhanced
                    </div>
                </div>

                {/* Community Selector */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <label className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-2 block">
                        Choose a community
                    </label>
                    <CommunitySelector
                        onSelect={(id) => setSelectedCommunityId(id)}
                        initialSlug={initialCommunity}
                    />
                </motion.div>

                {/* Composer Card */}
                <motion.div
                    className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Post Type Tabs */}
                    <div className="flex bg-base-200/30">
                        {[
                            { id: 'text', icon: Type, label: 'Post' },
                            { id: 'image', icon: ImageIcon, label: 'Image' },
                            { id: 'link', icon: LinkIcon, label: 'Link' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${activeTab === tab.id
                                    ? 'text-primary bg-base-100'
                                    : 'text-base-content/50 hover:text-base-content hover:bg-base-200/50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Editor Area */}
                    <div className="p-6">
                        {/* Title Input */}
                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="An interesting title..."
                                className="input input-lg w-full font-bold text-xl px-0 border-none focus:outline-none placeholder:text-base-content/20 bg-transparent"
                                value={title}
                                onChange={(e) => setTitle(e.target.value.slice(0, titleMaxChars))}
                                maxLength={titleMaxChars}
                            />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-base-content/30">
                                {title.length}/{titleMaxChars}
                            </div>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-base-content/10 to-transparent my-4" />

                        {/* Content Area - Animated Tab Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'text' && (
                                <motion.div
                                    key="text"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative"
                                >
                                    <textarea
                                        ref={textareaRef}
                                        className="textarea w-full min-h-[200px] focus:outline-none focus:border-primary/30 text-base p-4 resize-none leading-relaxed bg-base-200/30 rounded-xl border border-base-content/5"
                                        placeholder="Share your thoughts, insights, or questions... Markdown is supported."
                                        value={body}
                                        onChange={(e) => setBody(e.target.value.slice(0, bodyMaxChars))}
                                        maxLength={bodyMaxChars}
                                    />
                                    <div className="flex justify-between items-center mt-2 text-xs text-base-content/40">
                                        <span>Markdown supported</span>
                                        <span>{body.length.toLocaleString()}/{bodyMaxChars.toLocaleString()}</span>
                                    </div>

                                    {/* Quality tip */}
                                    <AnimatePresence>
                                        {body.length > 100 && body.length < 500 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="mt-4 flex items-center gap-2 bg-info/10 text-info text-xs px-4 py-2 rounded-full border border-info/20"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                <span>Pro tip: Posts with 500+ characters get 2x more engagement!</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {activeTab === 'image' && (
                                <motion.div
                                    key="image"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="border-2 border-dashed border-base-content/20 rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                                        <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                                            <Upload className="w-8 h-8 text-base-content/40 group-hover:text-primary transition-colors" />
                                        </div>
                                        <p className="font-bold mb-1">Drag and drop or click to upload</p>
                                        <p className="text-sm text-base-content/50">PNG, JPG, GIF, WEBP up to 20MB</p>
                                    </div>
                                    <p className="text-xs text-base-content/40 mt-4 text-center">
                                        Image uploads coming soon! Use a link for now.
                                    </p>
                                </motion.div>
                            )}

                            {activeTab === 'link' && (
                                <motion.div
                                    key="link"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="relative">
                                        <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30" />
                                        <input
                                            type="url"
                                            placeholder="https://example.com/article"
                                            className="input input-lg w-full pl-12 bg-base-200/30 border-base-content/10 focus:border-primary"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                        />
                                    </div>

                                    {/* Link Preview Placeholder */}
                                    {url && url.startsWith('http') && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-4 p-4 bg-base-200/50 rounded-xl border border-base-content/10"
                                        >
                                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Fetching link preview...
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="alert alert-error mt-4"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-base-content/10 to-transparent my-6" />

                        {/* Footer Actions */}
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <button className="btn btn-sm btn-ghost gap-1 opacity-50">
                                    <span className="text-xs">+ Tag</span>
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    className={`btn btn-primary px-8 gap-2 ${!canSubmit ? 'btn-disabled' : ''}`}
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                                    whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                                >
                                    {posting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Posting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Post
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Guidelines */}
                <motion.div
                    className="mt-8 p-6 bg-gradient-to-br from-base-200/50 to-base-100 rounded-2xl border border-base-content/5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-warning" />
                        Tips for a great post
                    </h3>
                    <ul className="text-sm text-base-content/60 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-success">✓</span>
                            Write a clear, descriptive title
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">✓</span>
                            Add context or your own thoughts
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">✓</span>
                            Cite sources when sharing information
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">✓</span>
                            Engage with commenters
                        </li>
                    </ul>
                </motion.div>
            </motion.div>

            {/* Right Sidebar - Preview */}
            <motion.div
                className="hidden xl:block w-80"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="sticky top-20">
                    <div className="card bg-base-100 shadow-lg border border-base-content/5 p-5">
                        <h3 className="font-bold text-sm mb-4 text-base-content/60">Post Preview</h3>

                        {title ? (
                            <div className="space-y-2">
                                <h4 className="font-bold text-lg leading-tight">{title}</h4>
                                {body && (
                                    <p className="text-sm text-base-content/70 line-clamp-4">{body}</p>
                                )}
                                {url && (
                                    <div className="text-xs text-primary truncate">{url}</div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-base-content/40 italic">
                                Start typing to see a preview...
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function SubmitPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <SubmitPageContent />
        </Suspense>
    );
}

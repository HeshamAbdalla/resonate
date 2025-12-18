'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Twitter, Facebook, Link as LinkIcon, Check, X } from 'lucide-react';

interface ShareModalProps {
    postId: string;
    title: string;
    communitySlug: string;
}

export default function ShareModal({ postId, title, communitySlug }: ShareModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const postUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/post/${postId}`
        : `/post/${postId}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(postUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOptions = [
        {
            name: 'Twitter',
            icon: Twitter,
            color: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]',
            onClick: () => {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(postUrl)}`, '_blank');
            },
        },
        {
            name: 'Facebook',
            icon: Facebook,
            color: 'hover:bg-[#4267B2]/10 hover:text-[#4267B2]',
            onClick: () => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
            },
        },
    ];

    return (
        <>
            <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => setIsOpen(true)}
            >
                <Share2 className="w-4 h-4" />
                Share
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6"
                        >
                            {/* Close button */}
                            <button
                                className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <h3 className="text-xl font-bold mb-6">Share this post</h3>

                            {/* Post preview */}
                            <div className="bg-base-200/50 rounded-xl p-4 mb-6">
                                <p className="font-medium line-clamp-2">{title}</p>
                                <p className="text-sm text-base-content/50 mt-1">r/{communitySlug}</p>
                            </div>

                            {/* Copy link */}
                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={postUrl}
                                    readOnly
                                    className="input input-bordered flex-1 text-sm bg-base-200"
                                />
                                <motion.button
                                    className={`btn ${copied ? 'btn-success' : 'btn-primary'} gap-2`}
                                    onClick={handleCopy}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </motion.button>
                            </div>

                            {/* Social share buttons */}
                            <div className="flex gap-3 justify-center">
                                {shareOptions.map((option) => (
                                    <motion.button
                                        key={option.name}
                                        className={`btn btn-ghost btn-lg btn-circle ${option.color}`}
                                        onClick={option.onClick}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        title={`Share on ${option.name}`}
                                    >
                                        <option.icon className="w-6 h-6" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

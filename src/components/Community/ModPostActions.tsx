'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2,
    AlertTriangle,
    Loader2,
    Shield,
    Pin,
    PinOff,
    Lock,
    Unlock,
    Flag,
    X,
    Check,
    AlertOctagon
} from 'lucide-react';

interface ModPostActionsProps {
    postId: string;
    communityId: string;
    isCreator: boolean;
    initialIsPinned?: boolean;
    initialIsLocked?: boolean;
    initialIsNSFW?: boolean;
}

export default function ModPostActions({
    postId,
    communityId,
    isCreator,
    initialIsPinned = false,
    initialIsLocked = false,
    initialIsNSFW = false,
}: ModPostActionsProps) {
    const router = useRouter();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const [mounted, setMounted] = useState(false);

    // Mod states
    const [isPinned, setIsPinned] = useState(initialIsPinned);
    const [isLocked, setIsLocked] = useState(initialIsLocked);
    const [isNSFW, setIsNSFW] = useState(initialIsNSFW);
    const [toggling, setToggling] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!isCreator) return null;

    const handleModAction = async (action: string) => {
        setToggling(action);
        setActionSuccess('');
        setError('');

        try {
            const res = await fetch(`/api/posts/${postId}/mod`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to perform action');
            }

            const data = await res.json();

            // Update local state
            if (action === 'togglePin') setIsPinned(data.post.isPinnedInCommunity);
            if (action === 'toggleLock') setIsLocked(data.post.isLocked);
            if (action === 'toggleNSFW') setIsNSFW(data.post.isNSFW);

            setActionSuccess(data.message);
            setShowToast(true);
            setIsOpen(false); // Close dropdown

            setTimeout(() => {
                setShowToast(false);
                setActionSuccess('');
            }, 3000);

            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                setError('');
            }, 3000);
        } finally {
            setToggling('');
        }
    };

    const handleRemove = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/posts/${postId}?reason=${encodeURIComponent(reason || 'Violated community guidelines')}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to remove post');
            }

            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const menuItemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: { delay: i * 0.05, duration: 0.2 }
        })
    };

    const dropdownContent = (
        <AnimatePresence>
            {isOpen && mounted && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="fixed bg-base-100 rounded-xl shadow-2xl border border-base-content/10 overflow-hidden min-w-[220px]"
                    style={{
                        top: dropdownPosition.top,
                        right: dropdownPosition.right,
                        zIndex: 99999,
                    }}
                >
                    <div className="p-2">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-3 py-2 flex items-center justify-between"
                        >
                            <span className="text-xs font-bold text-warning uppercase flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                Mod Actions
                            </span>
                            {actionSuccess && (
                                <motion.span
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-xs text-success flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" />
                                    Done
                                </motion.span>
                            )}
                        </motion.div>

                        {/* Pin Post */}
                        <motion.button
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={0}
                            onClick={() => handleModAction('togglePin')}
                            disabled={toggling === 'togglePin'}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-left disabled:opacity-50 ${isPinned ? 'text-primary' : ''
                                }`}
                        >
                            {toggling === 'togglePin' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isPinned ? (
                                <PinOff className="w-4 h-4" />
                            ) : (
                                <Pin className="w-4 h-4 text-base-content/60" />
                            )}
                            <span>{isPinned ? 'Unpin Post' : 'Pin Post'}</span>
                            {isPinned && <span className="badge badge-primary badge-xs ml-auto">Pinned</span>}
                        </motion.button>

                        {/* Lock Comments */}
                        <motion.button
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={1}
                            onClick={() => handleModAction('toggleLock')}
                            disabled={toggling === 'toggleLock'}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-left disabled:opacity-50 ${isLocked ? 'text-warning' : ''
                                }`}
                        >
                            {toggling === 'toggleLock' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isLocked ? (
                                <Unlock className="w-4 h-4" />
                            ) : (
                                <Lock className="w-4 h-4 text-base-content/60" />
                            )}
                            <span>{isLocked ? 'Unlock Comments' : 'Lock Comments'}</span>
                            {isLocked && <span className="badge badge-warning badge-xs ml-auto">Locked</span>}
                        </motion.button>

                        {/* Mark NSFW */}
                        <motion.button
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={2}
                            onClick={() => handleModAction('toggleNSFW')}
                            disabled={toggling === 'toggleNSFW'}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-left disabled:opacity-50 ${isNSFW ? 'text-error' : ''
                                }`}
                        >
                            {toggling === 'toggleNSFW' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isNSFW ? (
                                <AlertOctagon className="w-4 h-4" />
                            ) : (
                                <Flag className="w-4 h-4 text-base-content/60" />
                            )}
                            <span>{isNSFW ? 'Remove NSFW' : 'Mark as NSFW'}</span>
                            {isNSFW && <span className="badge badge-error badge-xs ml-auto">NSFW</span>}
                        </motion.button>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="h-px bg-base-content/10 my-2"
                        />

                        {/* Remove Post */}
                        <motion.button
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={3}
                            onClick={() => {
                                setIsOpen(false);
                                setShowConfirm(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-error/10 transition-colors text-left text-error"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove Post</span>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <motion.button
                ref={buttonRef}
                className="btn btn-ghost btn-xs gap-1 text-warning"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Shield className="w-3 h-3" />
                Mod
                {(isPinned || isLocked || isNSFW) && (
                    <span className="badge badge-xs badge-warning">
                        {[isPinned && 'P', isLocked && 'L', isNSFW && 'N'].filter(Boolean).join('')}
                    </span>
                )}
            </motion.button>

            {mounted && createPortal(dropdownContent, document.body)}

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowConfirm(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6"
                        >
                            <button
                                className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
                                onClick={() => setShowConfirm(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <motion.div
                                className="flex items-center gap-3 mb-4 text-error"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold">Remove Post?</h3>
                            </motion.div>

                            <motion.p
                                className="text-sm text-base-content/70 mb-4"
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.15 }}
                            >
                                This action will be <span className="font-bold text-warning">publicly logged</span> in the community mod log.
                            </motion.p>

                            <motion.div
                                className="form-control mb-4"
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <label className="label">
                                    <span className="label-text font-medium">Reason (visible to all)</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    placeholder="e.g., Spam, Off-topic, Harassment"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </motion.div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="alert alert-error mb-4 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <motion.div
                                className="flex justify-end gap-2"
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.25 }}
                            >
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    className="btn btn-error gap-2"
                                    onClick={handleRemove}
                                    disabled={loading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Removing...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Remove Post
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            {mounted && createPortal(
                <AnimatePresence>
                    {showToast && (actionSuccess || error) && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className={`fixed bottom-6 right-6 z-[100000] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border ${error
                                ? 'bg-error text-error-content border-error'
                                : 'bg-success text-success-content border-success'
                                }`}
                        >
                            {error ? (
                                <AlertTriangle className="w-5 h-5" />
                            ) : (
                                <Check className="w-5 h-5" />
                            )}
                            <span className="font-medium">{error || actionSuccess}</span>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

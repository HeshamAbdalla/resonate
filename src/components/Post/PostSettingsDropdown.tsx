'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MoreHorizontal,
    Edit3,
    Trash2,
    Pin,
    PinOff,
    MessageSquareOff,
    MessageSquare,
    Flag,
    Copy,
    Bookmark,
    BookmarkCheck,
    AlertTriangle,
    Loader2,
    X,
    Check
} from 'lucide-react';

interface PostSettingsDropdownProps {
    postId: string;
    authorId: string;
    communitySlug: string;
    initialIsPinned?: boolean;
    initialCommentsDisabled?: boolean;
}

export default function PostSettingsDropdown({
    postId,
    authorId,
    communitySlug,
    initialIsPinned = false,
    initialCommentsDisabled = false,
}: PostSettingsDropdownProps) {
    const router = useRouter();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [isAuthor, setIsAuthor] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const [mounted, setMounted] = useState(false);

    // Post states
    const [isSaved, setIsSaved] = useState(false);
    const [isPinned, setIsPinned] = useState(initialIsPinned);
    const [commentsDisabled, setCommentsDisabled] = useState(initialCommentsDisabled);
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState('');

    // Edit modal states
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editing, setEditing] = useState(false);

    // Report modal states
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [reporting, setReporting] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function checkAuthor() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setIsAuthor(data.userId === authorId);
                }
            } catch (error) {
                console.error('Error checking author:', error);
            }
        }
        checkAuthor();
    }, [authorId]);

    useEffect(() => {
        async function checkSaved() {
            try {
                const res = await fetch(`/api/posts/${postId}/save`);
                if (res.ok) {
                    const data = await res.json();
                    setIsSaved(data.saved);
                }
            } catch (error) {
                console.error('Error checking saved:', error);
            }
        }
        checkSaved();
    }, [postId]);

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

    const handleDelete = async () => {
        setDeleting(true);
        setError('');

        try {
            const res = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete post');
            }

            router.push(`/community/r/${communitySlug}`);
        } catch (err: any) {
            setError(err.message);
            setDeleting(false);
        }
    };

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/post/${postId}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
            setIsOpen(false);
        }, 1000);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/posts/${postId}/save`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                setIsSaved(data.saved);
            }
        } catch (error) {
            console.error('Error saving post:', error);
        } finally {
            setSaving(false);
            setIsOpen(false);
        }
    };

    const handleTogglePin = async () => {
        setToggling('pin');
        try {
            const res = await fetch(`/api/posts/${postId}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'togglePin' }),
            });
            if (res.ok) {
                const data = await res.json();
                setIsPinned(data.post.isPinned);
            }
        } catch (error) {
            console.error('Error toggling pin:', error);
        } finally {
            setToggling('');
            setIsOpen(false);
        }
    };

    const handleToggleComments = async () => {
        setToggling('comments');
        try {
            const res = await fetch(`/api/posts/${postId}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggleComments' }),
            });
            if (res.ok) {
                const data = await res.json();
                setCommentsDisabled(data.post.commentsDisabled);
                router.refresh();
            }
        } catch (error) {
            console.error('Error toggling comments:', error);
        } finally {
            setToggling('');
            setIsOpen(false);
        }
    };

    const handleEdit = async () => {
        setEditing(true);
        setError('');

        try {
            const res = await fetch(`/api/posts/${postId}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'edit',
                    title: editTitle,
                    content: editContent,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update post');
            }

            setShowEditModal(false);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setEditing(false);
        }
    };

    const openEditModal = async () => {
        setIsOpen(false);
        // Fetch current post data
        try {
            const res = await fetch(`/api/posts/${postId}/comments`);
            // For now, just open the modal
            setShowEditModal(true);
        } catch (error) {
            setShowEditModal(true);
        }
    };

    const handleReport = async () => {
        if (!reportReason) {
            setError('Please select a reason');
            return;
        }

        setReporting(true);
        setError('');

        try {
            const res = await fetch(`/api/posts/${postId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: reportReason,
                    details: reportDetails,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to report post');
            }

            setReportSuccess(true);
            setTimeout(() => {
                setShowReportModal(false);
                setReportSuccess(false);
                setReportReason('');
                setReportDetails('');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setReporting(false);
        }
    };

    const reportReasons = [
        'Spam or misleading',
        'Harassment or hate speech',
        'Violence or dangerous content',
        'Misinformation',
        'Copyright violation',
        'Other',
    ];

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
                        {/* Copy Link */}
                        <motion.button
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={0}
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-left"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-success" />
                                    <span className="text-success font-medium">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 text-base-content/60" />
                                    <span>Copy link</span>
                                </>
                            )}
                        </motion.button>

                        {/* Save */}
                        <motion.button
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={1}
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-left disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isSaved ? (
                                <BookmarkCheck className="w-4 h-4 text-primary" />
                            ) : (
                                <Bookmark className="w-4 h-4 text-base-content/60" />
                            )}
                            <span className={isSaved ? 'text-primary font-medium' : ''}>
                                {isSaved ? 'Saved' : 'Save post'}
                            </span>
                        </motion.button>

                        {/* Author Options */}
                        {isAuthor && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="h-px bg-base-content/10 my-2"
                                />
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                    className="px-3 py-1 text-xs font-bold text-base-content/40 uppercase"
                                >
                                    Your post
                                </motion.p>

                                {/* Edit */}
                                <motion.button
                                    variants={menuItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={2}
                                    onClick={openEditModal}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-left"
                                >
                                    <Edit3 className="w-4 h-4 text-base-content/60" />
                                    <span>Edit post</span>
                                </motion.button>

                                {/* Pin */}
                                <motion.button
                                    variants={menuItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={3}
                                    onClick={handleTogglePin}
                                    disabled={toggling === 'pin'}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-left disabled:opacity-50"
                                >
                                    {toggling === 'pin' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isPinned ? (
                                        <PinOff className="w-4 h-4 text-primary" />
                                    ) : (
                                        <Pin className="w-4 h-4 text-base-content/60" />
                                    )}
                                    <span className={isPinned ? 'text-primary' : ''}>
                                        {isPinned ? 'Unpin from profile' : 'Pin to profile'}
                                    </span>
                                </motion.button>

                                {/* Toggle Comments */}
                                <motion.button
                                    variants={menuItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={4}
                                    onClick={handleToggleComments}
                                    disabled={toggling === 'comments'}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors text-left disabled:opacity-50"
                                >
                                    {toggling === 'comments' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : commentsDisabled ? (
                                        <MessageSquare className="w-4 h-4 text-success" />
                                    ) : (
                                        <MessageSquareOff className="w-4 h-4 text-base-content/60" />
                                    )}
                                    <span>
                                        {commentsDisabled ? 'Enable comments' : 'Disable comments'}
                                    </span>
                                </motion.button>

                                {/* Delete */}
                                <motion.button
                                    variants={menuItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={5}
                                    onClick={() => {
                                        setIsOpen(false);
                                        setShowDeleteModal(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-error/10 transition-colors text-left text-error"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete post</span>
                                </motion.button>
                            </>
                        )}

                        {/* Report (for non-authors) */}
                        {!isAuthor && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="h-px bg-base-content/10 my-2"
                                />
                                <motion.button
                                    variants={menuItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={2}
                                    onClick={() => {
                                        setIsOpen(false);
                                        setShowReportModal(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-warning/10 transition-colors text-left text-warning"
                                >
                                    <Flag className="w-4 h-4" />
                                    <span>Report post</span>
                                </motion.button>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <motion.button
                ref={buttonRef}
                className="btn btn-ghost btn-sm btn-square"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <MoreHorizontal className="w-4 h-4" />
            </motion.button>

            {mounted && createPortal(dropdownContent, document.body)}

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowEditModal(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg p-6"
                        >
                            <button
                                className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
                                onClick={() => setShowEditModal(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-primary" />
                                Edit Post
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="label">
                                        <span className="label-text font-medium">Title</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        placeholder="Post title"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="label">
                                        <span className="label-text font-medium">Content</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered w-full h-32"
                                        placeholder="Post content (optional)"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="alert alert-error mt-4 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={editing}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    className="btn btn-primary gap-2"
                                    onClick={handleEdit}
                                    disabled={editing || !editTitle.trim()}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {editing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowDeleteModal(false)}
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
                                onClick={() => setShowDeleteModal(false)}
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
                                <h3 className="text-xl font-bold">Delete Post?</h3>
                            </motion.div>

                            <p className="text-base-content/70 mb-6">
                                This action cannot be undone. Your post and all its comments will be permanently deleted.
                            </p>

                            {error && (
                                <div className="alert alert-error mb-4 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    className="btn btn-error gap-2"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Delete Post
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => !reporting && setShowReportModal(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6"
                        >
                            {reportSuccess ? (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                                        <Check className="w-8 h-8 text-success" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Report Submitted</h3>
                                    <p className="text-base-content/60">
                                        Thank you for helping keep our community safe.
                                    </p>
                                </motion.div>
                            ) : (
                                <>
                                    <button
                                        className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
                                        onClick={() => setShowReportModal(false)}
                                        disabled={reporting}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    <div className="flex items-center gap-3 mb-4 text-warning">
                                        <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                                            <Flag className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold">Report Post</h3>
                                    </div>

                                    <p className="text-base-content/70 mb-4">
                                        Why are you reporting this post?
                                    </p>

                                    <div className="space-y-2 mb-4">
                                        {reportReasons.map((reason) => (
                                            <label
                                                key={reason}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${reportReason === reason
                                                        ? 'border-warning bg-warning/10'
                                                        : 'border-base-content/10 hover:bg-base-200'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="reportReason"
                                                    value={reason}
                                                    checked={reportReason === reason}
                                                    onChange={(e) => setReportReason(e.target.value)}
                                                    className="radio radio-warning radio-sm"
                                                />
                                                <span className="text-sm">{reason}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <div className="mb-4">
                                        <label className="label">
                                            <span className="label-text text-sm">Additional details (optional)</span>
                                        </label>
                                        <textarea
                                            className="textarea textarea-bordered w-full h-20"
                                            placeholder="Provide more context..."
                                            value={reportDetails}
                                            onChange={(e) => setReportDetails(e.target.value)}
                                        />
                                    </div>

                                    {error && (
                                        <div className="alert alert-error mb-4 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2">
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => setShowReportModal(false)}
                                            disabled={reporting}
                                        >
                                            Cancel
                                        </button>
                                        <motion.button
                                            className="btn btn-warning gap-2"
                                            onClick={handleReport}
                                            disabled={reporting || !reportReason}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {reporting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Flag className="w-4 h-4" />
                                                    Submit Report
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

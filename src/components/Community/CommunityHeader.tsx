'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Check, Loader2, Settings, CheckCircle, XCircle } from 'lucide-react';
import CommunityPulse from './CommunityPulse';
import CommunitySettingsModal from './CommunitySettingsModal';
import Link from 'next/link';
import RealtimeAvatarStack from '@/components/Realtime/RealtimeAvatarStack';

interface CommunityHeaderProps {
    communityId: string;
    name: string;
    title: string;
    members: string;
    active: string;
    description: string;
    bannerImage?: string | null;
    iconImage?: string | null;
    rules?: string | null;
    createdAt?: Date;
    creatorName?: string;
    creatorId?: string;
}

export default function CommunityHeader({
    communityId,
    name,
    title,
    members,
    active,
    description,
    bannerImage,
    iconImage,
    rules,
    createdAt,
    creatorName,
    creatorId
}: CommunityHeaderProps) {
    const router = useRouter();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Check subscription status and creator status on mount
    useEffect(() => {
        async function checkStatus() {
            try {
                const res = await fetch(`/api/communities/subscribe?communityId=${communityId}`);
                const data = await res.json();
                setIsSubscribed(data.subscribed);

                // Check if current user is the creator
                if (data.userId && creatorId && data.userId === creatorId) {
                    setIsCreator(true);
                }
            } catch (error) {
                console.error('Failed to check status:', error);
            }
            setLoading(false);
        }
        checkStatus();
    }, [communityId, creatorId]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleJoinLeave = async () => {
        setActionLoading(true);
        try {
            if (isSubscribed) {
                // Unsubscribe
                await fetch(`/api/communities/subscribe?communityId=${communityId}`, {
                    method: 'DELETE',
                });
                setIsSubscribed(false);
                showToast(`Left ${title}`, 'success');
            } else {
                // Subscribe
                const res = await fetch('/api/communities/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ communityId }),
                });
                if (res.ok) {
                    setIsSubscribed(true);
                    showToast(`Joined ${title}! 🎉`, 'success');
                } else {
                    const data = await res.json();
                    if (res.status === 401) {
                        router.push('/login');
                    } else {
                        showToast(data.error || 'Failed to join', 'error');
                    }
                }
            }
        } catch (error) {
            showToast('Something went wrong', 'error');
        }
        setActionLoading(false);
    };

    // Extract slug from name (e.g., "r/FutureTech" -> "FutureTech")
    const slug = name.replace('r/', '');

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full rounded-2xl overflow-hidden mb-8 border border-base-content/5 shadow-lg bg-base-100 group"
            >
                {/* Banner Background */}
                {bannerImage ? (
                    <motion.div
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 h-48"
                    >
                        <img
                            src={bannerImage}
                            alt="Community banner"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent" />
                    </motion.div>
                ) : (
                    <>
                        <div className="absolute inset-0 h-48 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 opacity-80" />
                        <div className="absolute inset-0 h-48 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    </>
                )}

                {/* Content Wrapper */}
                <div className="relative pt-32 px-6 pb-6">
                    <div className="flex flex-col md:flex-row items-end gap-6">

                        {/* Avatar / Icon */}
                        <motion.div
                            initial={{ scale: 0.8, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="w-24 h-24 rounded-2xl bg-base-100 p-1 shadow-2xl z-10"
                        >
                            {iconImage ? (
                                <img
                                    src={iconImage}
                                    alt={`${title} icon`}
                                    className="w-full h-full rounded-xl object-cover"
                                />
                            ) : (
                                <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                                    {title[0]?.toUpperCase() || 'C'}
                                </div>
                            )}
                        </motion.div>

                        {/* Info Block */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex-1 mb-2"
                        >
                            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md mb-1">
                                {title}
                            </h1>
                            <div className="text-white/80 font-bold text-sm mb-4">
                                {name}
                            </div>


                            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-base-content/70">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center gap-1.5 bg-base-200/50 px-3 py-1.5 rounded-full backdrop-blur-md"
                                >
                                    <Users className="w-4 h-4 text-primary" />
                                    <span className="text-base-content font-bold">{members}</span>
                                    <span className="text-base-content/50">Members</span>
                                </motion.div>

                                {/* Realtime Online Users */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-base-200/50 px-3 py-1.5 rounded-full backdrop-blur-md"
                                >
                                    <RealtimeAvatarStack
                                        roomName={`community:${communityId}`}
                                        maxAvatars={4}
                                        size="sm"
                                    />
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Right Side: Pulse & Actions */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col gap-4 items-end w-full md:w-auto"
                        >
                            <CommunityPulse communityId={communityId} />

                            <div className="flex gap-2 w-full md:w-auto">
                                {/* Join/Leave Button */}
                                <button
                                    className={`btn flex-1 md:flex-none min-w-[140px] gap-2 ${isSubscribed ? 'btn-outline' : 'btn-primary'}`}
                                    onClick={handleJoinLeave}
                                    disabled={loading || actionLoading}
                                >
                                    {loading || actionLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isSubscribed ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Joined
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Join
                                        </>
                                    )}
                                </button>

                                {/* Create Post Button */}
                                <Link
                                    href={`/submit?community=${slug}`}
                                    className="btn btn-secondary gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Post
                                </Link>

                                {/* Settings Button (Creator/Mod Only) */}
                                {isCreator && (
                                    <motion.button
                                        whileHover={{ rotate: 90 }}
                                        transition={{ duration: 0.2 }}
                                        className="btn btn-square btn-ghost border border-base-content/10"
                                        onClick={() => setShowSettings(true)}
                                        title="Community Settings"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Description & Meta (Below Fold) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        <div className="lg:col-span-2">
                            <h3 className="text-xs font-bold uppercase text-base-content/40 tracking-widest mb-2">About</h3>
                            <p className="text-base-content/80 leading-relaxed max-w-2xl">
                                {description}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold uppercase text-base-content/40 tracking-widest mb-2">Info</h3>
                            <div className="space-y-2 text-sm">
                                {createdAt && (
                                    <p className="text-base-content/60">
                                        Created {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </p>
                                )}
                                {creatorName && (
                                    <p className="text-base-content/60">
                                        by <Link href={`/u/${creatorName}`} className="font-medium text-primary hover:underline">u/{creatorName}</Link>
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* Settings Modal */}
                <CommunitySettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    community={{
                        id: communityId,
                        name: title,
                        slug: slug,
                        description: description,
                        bannerImage: bannerImage || null,
                        iconImage: iconImage || null,
                        rules: rules || null,
                    }}
                    onSave={() => {
                        router.refresh();
                    }}
                />
            </motion.div>

            {/* Toast Notification */}
            {mounted && createPortal(
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="fixed bottom-6 right-6 z-[99999]"
                        >
                            <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'} shadow-2xl pr-8`}>
                                {toast.type === 'success' ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <XCircle className="w-5 h-5" />
                                )}
                                <span className="font-medium">{toast.message}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

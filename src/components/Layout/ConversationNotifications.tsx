'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, MessageCircle, Radio, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface Notification {
    postId: string;
    postTitle: string;
    communitySlug: string;
    newReplies: number;
}

export default function ConversationNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [totalNew, setTotalNew] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasRealtimeUpdate, setHasRealtimeUpdate] = useState(false);

    // Real-time notifications
    const { isConnected, hasNewNotifications, clearNewNotifications } = useRealtimeNotifications({
        onNewNotification: useCallback(() => {
            setHasRealtimeUpdate(true);
            // Fetch new notifications immediately
            fetchNotifications();
        }, []),
    });

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds as fallback
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/user/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setTotalNew(data.totalNewReplies || 0);
                setHasRealtimeUpdate(false);
                clearNewNotifications();
            }
        } catch (e) {
            console.error('Failed to fetch notifications:', e);
        } finally {
            setLoading(false);
        }
    };

    const markAsSeen = async () => {
        try {
            await fetch('/api/user/notifications', { method: 'POST' });
            setNotifications([]);
            setTotalNew(0);
        } catch (e) {
            console.error('Failed to mark as seen:', e);
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-base-content/10 transition-colors relative"
            >
                <Bell className={`w-5 h-5 ${totalNew > 0 ? 'text-primary' : ''}`} />
                {totalNew > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 badge badge-primary badge-xs"
                    >
                        {totalNew > 99 ? '99+' : totalNew}
                    </motion.span>
                )}
                {/* Realtime update indicator */}
                {isConnected && hasRealtimeUpdate && (
                    <span className="absolute -bottom-1 -right-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 mt-1 w-[calc(100vw-2rem)] max-w-sm md:w-80 bg-base-100 border border-base-content/10 rounded-lg shadow-xl z-[60]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-3 border-b border-base-content/10">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm">Notifications</h3>
                                    {/* Connection status */}
                                    <span className={`badge badge-xs gap-1 ${isConnected ? 'badge-success' : 'badge-ghost'}`}>
                                        {isConnected ? <Wifi className="w-2 h-2" /> : <WifiOff className="w-2 h-2" />}
                                        {isConnected ? 'Live' : ''}
                                    </span>
                                </div>
                                {totalNew > 0 && (
                                    <button
                                        onClick={markAsSeen}
                                        className="btn btn-ghost btn-xs"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-80 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 text-center text-sm opacity-50">
                                        Loading...
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-6 text-center">
                                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-base-content/30" />
                                        <p className="text-sm text-base-content/60">
                                            No new activity in your conversations
                                        </p>
                                        {isConnected && (
                                            <p className="text-xs text-success mt-2 flex items-center justify-center gap-1">
                                                <Radio className="w-3 h-3" />
                                                You'll be notified instantly
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <Link
                                            key={n.postId}
                                            href={`/post/${n.postId}`}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-start gap-3 p-3 hover:bg-base-200 transition-colors"
                                        >
                                            <div className="p-2 bg-primary/10 rounded-full">
                                                <MessageCircle className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium line-clamp-2">
                                                    {n.postTitle}
                                                </p>
                                                <p className="text-xs text-base-content/60 flex items-center gap-2">
                                                    <span>r/{n.communitySlug}</span>
                                                    <span className="font-bold text-primary">
                                                        {n.newReplies} new {n.newReplies === 1 ? 'reply' : 'replies'}
                                                    </span>
                                                </p>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>

                            {/* Footer with realtime status */}
                            {isConnected && (
                                <div className="p-2 border-t border-base-content/10 text-center">
                                    <span className="text-xs text-success flex items-center justify-center gap-1">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                                        </span>
                                        Real-time updates active
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

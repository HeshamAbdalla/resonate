'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMessagePanel } from '@/contexts/MessagePanelContext';

interface Conversation {
    id: string;
    participants: {
        id: string;
        username: string;
        name?: string;
        image?: string;
    }[];
    lastMessage: {
        content: string;
        createdAt: string;
    } | null;
    updatedAt: string;
    unreadCount: number;
}

export default function NavbarMessageDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const { openPanel } = useMessagePanel();

    // Fetch just unread count on mount (lightweight)
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await fetch('/api/messages/unread');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.unreadCount || 0);
                }
            } catch (e) {
                console.error('Error fetching unread count:', e);
            }
        };

        fetchUnreadCount();
        // Poll unread count every 60 seconds (not 30)
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch full conversations only when dropdown opens
    useEffect(() => {
        if (!isOpen) return;

        const fetchConversations = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/messages');
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data.conversations || []);
                }
            } catch (e) {
                console.error('Error fetching messages:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [isOpen]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    const handleConversationClick = (conv: Conversation) => {
        setIsOpen(false);
        openPanel(conv);
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-base-content/10 transition-colors relative"
            >
                <MessageSquare className={`h-5 w-5 ${unreadCount > 0 ? 'text-primary' : 'opacity-70'}`} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 badge badge-primary badge-xs"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
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
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="absolute right-0 mt-2 w-80 bg-base-100 border border-base-content/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-3 border-b border-base-content/10">
                                <h3 className="font-bold text-sm">Messages</h3>
                                <Link
                                    href="/messages"
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    View all <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {/* Content */}
                            <div className="max-h-80 overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-base-content/30" />
                                        <p className="text-sm text-base-content/60">No messages yet</p>
                                        <p className="text-xs text-base-content/40 mt-1">
                                            Start a conversation with someone!
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        {conversations.slice(0, 5).map((conv, index) => {
                                            const participant = conv.participants[0];
                                            return (
                                                <motion.button
                                                    key={conv.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                                                    onClick={() => handleConversationClick(conv)}
                                                    className="w-full flex items-start gap-3 p-3 hover:bg-base-200/50 transition-colors text-left"
                                                >
                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                        {participant?.image ? (
                                                            <img src={participant.image} alt={participant.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-primary-content font-bold">
                                                                {participant?.username?.[0]?.toUpperCase() || '?'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-semibold text-sm truncate">
                                                                {participant?.name || participant?.username}
                                                            </span>
                                                            <span className="text-[10px] text-base-content/50 flex-shrink-0">
                                                                {conv.lastMessage && formatTime(conv.lastMessage.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-base-content/60 truncate mt-0.5">
                                                            {conv.lastMessage?.content || 'No messages yet'}
                                                        </p>
                                                    </div>

                                                    {/* Unread indicator */}
                                                    {conv.unreadCount > 0 && (
                                                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {conversations.length > 5 && (
                                <div className="p-2 border-t border-base-content/10">
                                    <Link
                                        href="/messages"
                                        onClick={() => setIsOpen(false)}
                                        className="block text-center text-xs text-primary hover:underline py-1"
                                    >
                                        See all {conversations.length} conversations
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

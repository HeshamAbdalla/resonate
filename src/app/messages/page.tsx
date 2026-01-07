'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Loader2, Search, PenSquare } from 'lucide-react';

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
}

export default function MessagesPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Check authentication first
    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setIsAuthenticated(true);
                    } else {
                        // Not authenticated, redirect to login
                        router.push('/login?returnTo=%2Fmessages');
                    }
                } else {
                    // Not authenticated, redirect to login
                    router.push('/login?returnTo=%2Fmessages');
                }
            } catch (error) {
                console.error('Failed to check auth:', error);
                router.push('/login?returnTo=%2Fmessages');
            }
        }
        checkAuth();
    }, [router]);

    useEffect(() => {
        // Only fetch conversations if authenticated
        if (isAuthenticated !== true) return;

        async function fetchConversations() {
            try {
                const res = await fetch('/api/messages');
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data.conversations || []);
                }
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchConversations();
    }, [isAuthenticated]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (hours < 168) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.participants.some(p =>
            p.username.toLowerCase().includes(search.toLowerCase()) ||
            p.name?.toLowerCase().includes(search.toLowerCase())
        )
    );

    // Show loading spinner while checking authentication
    if (isAuthenticated === null || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <MessageCircle className="w-7 h-7 text-primary" />
                    Messages
                </h1>
                <Link href="/messages/new" className="btn btn-primary btn-sm gap-2">
                    <PenSquare className="w-4 h-4" />
                    New Message
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                    type="text"
                    placeholder="Search conversations..."
                    className="input input-bordered w-full pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Conversations List */}
            <div className="card bg-base-100 border border-base-content/10 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                        <h3 className="text-lg font-bold mb-2">
                            {conversations.length === 0 ? 'No messages yet' : 'No matches found'}
                        </h3>
                        <p className="text-base-content/60">
                            {conversations.length === 0
                                ? 'Start a conversation with someone!'
                                : 'Try a different search term'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-base-content/5">
                        {filteredConversations.map((conv) => {
                            const otherUser = conv.participants[0];
                            return (
                                <Link
                                    key={conv.id}
                                    href={`/messages/${conv.id}`}
                                    className="flex items-center gap-4 p-4 hover:bg-base-200/50 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="avatar placeholder">
                                        <div className="w-12 h-12 rounded-full bg-primary/20">
                                            {otherUser?.image ? (
                                                <img src={otherUser.image} alt={otherUser.username} />
                                            ) : (
                                                <span className="text-lg">
                                                    {otherUser?.username[0]?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold truncate">
                                                {otherUser?.name || otherUser?.username || 'Unknown'}
                                            </span>
                                            {conv.lastMessage && (
                                                <span className="text-xs text-base-content/50">
                                                    {formatTime(conv.lastMessage.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        {conv.lastMessage ? (
                                            <p className="text-sm text-base-content/60 truncate">
                                                {conv.lastMessage.content}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-base-content/40 italic">
                                                No messages yet
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

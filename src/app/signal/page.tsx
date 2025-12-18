'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, Flame, MessageSquare, Sparkles, Loader2, Radio, Wifi, WifiOff } from 'lucide-react';
import SignalPostCard from '@/components/Feed/SignalPostCard';
import RightSidebarClient from '@/components/Layout/RightSidebarClient';
import { useLiveSignal } from '@/hooks/useLiveSignal';

type FilterType = 'hot' | 'rising' | 'deep' | 'live';

interface SignalPost {
    id: string;
    title: string;
    content: string | null;
    createdAt: string;
    score: number;
    signalScore: number;
    signalReasons: string[];
    author: {
        id: string;
        username: string;
        image: string | null;
    };
    community: {
        id: string;
        slug: string;
        name: string;
    };
    _count: {
        comments: number;
    };
    uniqueVoices: number;
    conversationVelocity: number;
    hasCreatorReply: boolean;
    recentParticipants: {
        id: string;
        username: string;
        image: string | null;
    }[];
    previewReplies: {
        author: string;
        content: string;
    }[];
    isDeepThread: boolean;
    isFeatured: boolean;
    // Live fields
    isLive?: boolean;
    lastActivityAt?: string | null;
    liveScore?: number;
    repliesInLast30Min?: number;
}

function SignalFeedContent() {
    // Use Next.js hook to get URL params correctly on both server and client
    const searchParams = useSearchParams();
    const urlFilter = searchParams.get('filter');
    const initialFilter = urlFilter && ['hot', 'rising', 'deep', 'live'].includes(urlFilter)
        ? urlFilter as FilterType
        : 'hot';

    const [filter, setFilter] = useState<FilterType>(initialFilter);
    const [posts, setPosts] = useState<SignalPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [liveCount, setLiveCount] = useState(0);
    const [pendingUpdates, setPendingUpdates] = useState(0);
    const hasFetched = useRef(false);

    // Sync filter with URL when it changes
    useEffect(() => {
        if (urlFilter && ['hot', 'rising', 'deep', 'live'].includes(urlFilter)) {
            setFilter(urlFilter as FilterType);
        }
    }, [urlFilter]);

    // Real-time updates via Supabase
    const { isConnected, recentActivityCount } = useLiveSignal({
        onActivity: useCallback(() => {
            // When in live mode, show pending update indicator
            if (filter === 'live') {
                setPendingUpdates(prev => prev + 1);
            }
        }, [filter]),
    });

    // Fetch posts function
    const fetchPosts = useCallback(async (filterToUse: FilterType, showLoader = false) => {
        if (showLoader) setLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await fetch(`/api/posts/signal?filter=${filterToUse}&limit=20`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts || []);
                setHasMore(data.hasMore || false);
                setLiveCount(data.liveCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch signal feed:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Fetch when filter changes
    useEffect(() => {
        // Always fetch when filter changes (debounce prevents double fetch)
        const timeout = setTimeout(() => {
            fetchPosts(filter, !hasFetched.current);
            hasFetched.current = true;
            setPendingUpdates(0);
        }, 50); // Small delay to ensure filter is stable

        return () => clearTimeout(timeout);
    }, [filter, fetchPosts]);

    // Auto-refresh live feed every 30 seconds
    useEffect(() => {
        if (filter !== 'live') return;

        const interval = setInterval(() => {
            fetchPosts(filter, false);
        }, 30000);

        return () => clearInterval(interval);
    }, [filter, fetchPosts]);

    // Auto-refresh when there are pending updates and user is in live mode
    useEffect(() => {
        if (pendingUpdates > 0 && filter === 'live') {
            // Small delay to batch multiple rapid updates
            const timeout = setTimeout(() => {
                fetchPosts(filter, false);
                setPendingUpdates(0);
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [pendingUpdates, filter, fetchPosts]);

    // Update URL when filter changes via tab click
    const handleFilterChange = (newFilter: FilterType) => {
        setFilter(newFilter);
        // Update URL without navigation
        const url = new URL(window.location.href);
        url.searchParams.set('filter', newFilter);
        window.history.replaceState({}, '', url.toString());
    };

    const filters: { key: FilterType; label: string; icon: typeof Flame; desc: string; special?: boolean }[] = [
        { key: 'live', label: 'Live', icon: Radio, desc: 'Conversations happening right now', special: true },
        { key: 'hot', label: 'Hot', icon: Flame, desc: 'Most engaging conversations' },
        { key: 'rising', label: 'Rising', icon: Zap, desc: 'Active in the last few hours' },
        { key: 'deep', label: 'Deep Threads', icon: MessageSquare, desc: 'In-depth discussions' },
    ];

    // Format time ago for last activity
    const formatLastActivity = (dateStr: string | null | undefined) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    return (
        <div className="flex gap-8 justify-center items-start pt-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-black flex items-center gap-3 mb-2 flex-wrap">
                        <Sparkles className="w-8 h-8 text-primary" />
                        Signal Feed
                        {filter === 'live' && liveCount > 0 && (
                            <span className="badge badge-error gap-1 animate-pulse">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                {liveCount} live
                            </span>
                        )}
                        {/* Realtime connection status */}
                        {filter === 'live' && (
                            <span className={`badge badge-sm gap-1 ${isConnected ? 'badge-success' : 'badge-warning'}`}>
                                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                {isConnected ? 'Real-time' : 'Polling'}
                            </span>
                        )}
                        {/* Refreshing indicator */}
                        {isRefreshing && (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                    </h1>
                    <p className="text-base-content/60">
                        {filter === 'live'
                            ? isConnected
                                ? 'Live conversations update automatically as people comment. You\'re connected in real-time!'
                                : 'Conversations with activity in the last 30 minutes. Auto-refreshes every 30 seconds.'
                            : 'High-signal conversations, not viral noise. See where people are actually talking.'}
                    </p>
                    {/* Recent activity indicator */}
                    {filter === 'live' && recentActivityCount > 0 && (
                        <div className="mt-2 text-sm text-success flex items-center gap-2">
                            <Radio className="w-4 h-4 animate-pulse" />
                            {recentActivityCount} {recentActivityCount === 1 ? 'comment' : 'comments'} in the last minute
                        </div>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="tabs tabs-boxed bg-base-200/50 mb-6 p-1">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`tab flex-1 gap-2 ${filter === f.key ? 'tab-active' : ''} ${f.special && filter !== f.key ? 'text-error' : ''}`}
                        >
                            {f.special && filter !== f.key && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                                </span>
                            )}
                            <f.icon className="w-4 h-4" />
                            {f.label}
                            {f.key === 'live' && liveCount > 0 && filter !== 'live' && (
                                <span className="badge badge-error badge-xs">{liveCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Filter Description */}
                <div className="text-sm text-base-content/50 mb-4 flex items-center gap-2">
                    {filters.find(f => f.key === filter)?.icon && (
                        <span className="badge badge-ghost badge-sm">{filters.find(f => f.key === filter)?.desc}</span>
                    )}
                    {filter === 'live' && !loading && (
                        <button onClick={() => fetchPosts(filter, false)} className="btn btn-ghost btn-xs gap-1" disabled={isRefreshing}>
                            <Radio className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    )}
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="card bg-base-100 border border-dashed border-base-content/20 p-12 text-center">
                        {filter === 'live' ? (
                            <>
                                <Radio className="w-16 h-16 mx-auto mb-4 text-base-content/20" />
                                <h3 className="text-xl font-bold mb-2">No live conversations right now</h3>
                                <p className="text-base-content/60">
                                    Conversations become "live" when they have replies in the last 30 minutes.
                                    Check back soon or start one yourself!
                                </p>
                            </>
                        ) : (
                            <>
                                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-base-content/20" />
                                <h3 className="text-xl font-bold mb-2">No conversations yet</h3>
                                <p className="text-base-content/60">
                                    Be the first to start a discussion. Quality conversations rise to the top.
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <div key={post.id} className="relative">
                                {/* Live indicator for individual posts */}
                                {filter === 'live' && post.lastActivityAt && (
                                    <div className="absolute -top-2 -right-2 z-10">
                                        <span className="badge badge-sm badge-error gap-1">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                            </span>
                                            {formatLastActivity(post.lastActivityAt)}
                                        </span>
                                    </div>
                                )}
                                <SignalPostCard post={post} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Load More */}
                {hasMore && !loading && (
                    <div className="text-center mt-8">
                        <button className="btn btn-primary btn-outline">
                            Load more conversations
                        </button>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <RightSidebarClient />
        </div>
    );
}

export default function SignalFeedPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <SignalFeedContent />
        </Suspense>
    );
}


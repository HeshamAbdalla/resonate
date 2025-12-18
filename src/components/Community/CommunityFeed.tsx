'use client';

import { useState, useEffect } from 'react';
import { Flame, Clock, TrendingUp, Search, Loader2 } from 'lucide-react';
import PostCard from '@/components/Feed/PostCard';
import ModPostActions from '@/components/Community/ModPostActions';
import ConversationStarter from '@/components/Post/ConversationStarter';

interface Post {
    id: string;
    title: string;
    content: string | null;
    type: string;
    url: string | null;
    score: number;
    isPinnedInCommunity?: boolean;
    isLocked?: boolean;
    isNSFW?: boolean;
    createdAt: string;
    author: { username: string; reputation: number };
    community: { slug: string; id: string; creatorId: string };
    _count: { comments: number };
}

interface CommunityFeedProps {
    communitySlug: string;
    communityId: string;
    creatorId: string;
    initialPosts: Post[];
}

type SortType = 'hot' | 'new' | 'top';

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function CommunityFeed({
    communitySlug,
    communityId,
    creatorId,
    initialPosts
}: CommunityFeedProps) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [sort, setSort] = useState<SortType>('hot');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCreator, setIsCreator] = useState(false);

    // Check if user is creator
    useEffect(() => {
        async function checkCreator() {
            try {
                const res = await fetch(`/api/communities/subscribe?communityId=${communityId}`);
                const data = await res.json();
                if (data.userId && data.userId === creatorId) {
                    setIsCreator(true);
                }
            } catch (error) {
                console.error('Error checking creator:', error);
            }
        }
        checkCreator();
    }, [communityId, creatorId]);

    // Fetch posts when sort changes
    useEffect(() => {
        async function fetchPosts() {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    communitySlug,
                    sort,
                    limit: '50',
                });
                if (search) params.set('search', search);

                const res = await fetch(`/api/posts?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.posts || []);
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        }

        // Debounce search
        const timer = setTimeout(fetchPosts, search ? 300 : 0);
        return () => clearTimeout(timer);
    }, [sort, search, communitySlug]);

    // Sort posts: pinned first
    const sortedPosts = [...posts].sort((a, b) => {
        if (a.isPinnedInCommunity && !b.isPinnedInCommunity) return -1;
        if (!a.isPinnedInCommunity && b.isPinnedInCommunity) return 1;
        return 0;
    });

    // Filter by search
    const filteredPosts = search
        ? sortedPosts.filter(p =>
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.content?.toLowerCase().includes(search.toLowerCase())
        )
        : sortedPosts;

    const tabs = [
        { id: 'hot' as SortType, label: 'Hot', icon: Flame },
        { id: 'new' as SortType, label: 'New', icon: Clock },
        { id: 'top' as SortType, label: 'Top', icon: TrendingUp },
    ];

    return (
        <div>
            {/* Conversation Starter */}
            <div className="mb-4">
                <ConversationStarter
                    communityId={communityId}
                    communitySlug={communitySlug}
                />
            </div>

            {/* Sort Tabs + Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div role="tablist" className="tabs tabs-boxed bg-base-200/50 p-1.5 rounded-xl shadow-sm border border-base-content/10 flex-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            role="tab"
                            onClick={() => setSort(tab.id)}
                            className={`tab gap-2 transition-all font-medium ${sort === tab.id
                                ? 'tab-active !bg-primary !text-primary-content'
                                : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input input-bordered pl-10 w-full sm:w-64 h-11"
                    />
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {/* Posts */}
            {!loading && filteredPosts.length === 0 && (
                <div className="bg-base-100 rounded-2xl border border-base-content/10 p-12 text-center">
                    <p className="text-base-content/60">
                        {search ? 'No posts match your search' : 'No posts yet in this community'}
                    </p>
                </div>
            )}

            {!loading && filteredPosts.length > 0 && (
                <div className="flex flex-col gap-4">
                    {filteredPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            postId={post.id}
                            score={post.score}
                            subreddit={`r/${post.community.slug}`}
                            communitySlug={post.community.slug}
                            author={post.author.username}
                            time={formatTimeAgo(post.createdAt)}
                            title={post.title}
                            content={post.content || ''}
                            type={post.type}
                            url={post.url || undefined}
                            hasImage={post.type === 'image'}
                            imageUrl={post.type === 'image' ? post.url || undefined : undefined}
                            commentCount={post._count.comments}
                            isVerified={post.author.reputation > 100}
                            isPinned={post.isPinnedInCommunity}
                            isLocked={post.isLocked}
                            isNSFW={post.isNSFW}
                            modActions={
                                <ModPostActions
                                    postId={post.id}
                                    communityId={communityId}
                                    isCreator={isCreator}
                                    initialIsPinned={post.isPinnedInCommunity}
                                    initialIsLocked={post.isLocked}
                                    initialIsNSFW={post.isNSFW}
                                />
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

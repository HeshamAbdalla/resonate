'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/Feed/PostCard';
import RightSidebarClient from '@/components/Layout/RightSidebarClient';
import HiddenGemCard from '@/components/Popular/HiddenGemCard';
import { Sparkles, Globe, MapPin, Smile, BookOpen, Zap, Coffee, Filter, Gem } from 'lucide-react';

type Post = {
    id: string;
    title: string;
    content: string | null;
    type: string;
    url: string | null;
    score: number;
    createdAt: string;
    author: { id: string; username: string; reputation: number };
    community: { slug: string };
    _count: { comments: number };
};

function formatScore(score: number): string {
    if (score >= 1000) {
        return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
}

export default function PopularPage() {
    const [activeVibe, setActiveVibe] = useState('All');
    const [scope, setScope] = useState<'Global' | 'Local'>('Global');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const vibes = [
        { id: 'All', label: 'All Vibes', icon: Sparkles, color: 'text-warning' },
        { id: 'Wholesome', label: 'Wholesome', icon: Smile, color: 'text-success' },
        { id: 'Intellectual', label: 'Intellectual', icon: BookOpen, color: 'text-info' },
        { id: 'HighEnergy', label: 'High Energy', icon: Zap, color: 'text-error' },
        { id: 'Relaxed', label: 'Relaxed', icon: Coffee, color: 'text-secondary' },
    ];

    useEffect(() => {
        async function fetchPosts() {
            setLoading(true);
            try {
                const res = await fetch('/api/posts/popular');
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data);
                }
            } catch (error) {
                console.error('Failed to fetch posts:', error);
            }
            setLoading(false);
        }
        fetchPosts();
    }, []);

    // Mock Hidden Gems (we can implement small communities later)
    const hiddenGems = [
        {
            subreddit: 'r/UrbanSketchers',
            memberCount: '8.2k',
            author: 'PencilAddict',
            title: 'Spent 3 hours drawing this quiet corner in Tokyo.',
            previewText: 'I tried to capture the feeling of the rain hitting the pavement. Used mostly watercolors and ink.',
            score: '342',
            commentCount: 28
        },
        {
            subreddit: 'r/SourdoughScience',
            memberCount: '4.5k',
            author: 'YeastBeast',
            title: 'The impact of hydration percentages on crumb structure.',
            previewText: 'Ran a controlled experiment with 65%, 75%, and 85% hydration levels while keeping fermentation time constant.',
            score: '215',
            commentCount: 56
        }
    ];

    return (
        <div className="flex gap-8 justify-center items-start pt-6 overflow-x-hidden">

            <div className="w-full max-w-3xl">

                {/* Header & Controls - Improved mobile layout */}
                <div className="flex flex-col gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-2 mb-1">
                            <Globe className="w-8 h-8 text-primary motion-spin-in-[180deg] motion-duration-700" />
                            Popular Now
                        </h1>
                        <p className="text-base-content/60 text-sm max-w-full">
                            Curated content from across the Resonate network.
                        </p>
                    </div>

                    {/* Scope Toggle - Centered on mobile, right-aligned on desktop */}
                    <div className="self-center md:self-end">
                        <div className="join bg-base-200 p-1 rounded-lg">
                            <button
                                onClick={() => setScope('Global')}
                                className={`btn btn-sm join-item border-none min-h-[44px] touch-active ${scope === 'Global' ? 'btn-active bg-base-100 shadow-sm' : 'btn-ghost'}`}
                            >
                                <Globe className="w-4 h-4" /> Global
                            </button>
                            <button
                                onClick={() => setScope('Local')}
                                className={`btn btn-sm join-item border-none min-h-[44px] touch-active ${scope === 'Local' ? 'btn-active bg-base-100 shadow-sm' : 'btn-ghost'}`}
                            >
                                <MapPin className="w-4 h-4" /> Near Me
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vibe Check Filter (Horizontal Scroll) - Fixed with scroll indicators */}
                <div className="mb-8 -mx-3 sm:mx-0">
                    <div
                        className="overflow-x-auto pb-2 custom-scrollbar px-3 sm:px-0"
                        style={{
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)',
                            maskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)'
                        }}
                    >
                        <div className="flex gap-2 min-w-max">
                            {vibes.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => setActiveVibe(v.id)}
                                    className={`btn btn-sm rounded-full gap-2 transition-all duration-300 ${activeVibe === v.id
                                        ? 'btn-primary shadow-md scale-105'
                                        : 'btn-ghost bg-base-200/50 text-base-content/70 hover:bg-base-200'
                                        }`}
                                >
                                    <v.icon className={`w-4 h-4 ${activeVibe === v.id ? 'text-primary-content' : v.color}`} />
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Hidden Gems Carousel */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Gem className="w-4 h-4 text-secondary" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-base-content/60">Hidden Gems • Small Communities</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {hiddenGems.map((gem, i) => (
                            <div key={i} className="motion-translate-y-in-[20px] motion-opacity-in-[0%] motion-delay-[100ms]">
                                <HiddenGemCard {...gem} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Feed */}
                <div className="divider text-xs font-bold text-base-content/30 mb-6">FEED • {activeVibe.toUpperCase()}</div>

                <div className="flex flex-col gap-2">
                    {loading ? (
                        <div className="text-center py-20 opacity-50">
                            <div className="loading loading-spinner loading-lg"></div>
                            <p className="mt-4">Loading posts...</p>
                        </div>
                    ) : posts.length > 0 ? (
                        posts.map((post) => (
                            <div key={post.id} className="motion-translate-y-in-[20px] motion-opacity-in-[0%] motion-delay-[200ms]">
                                <PostCard
                                    postId={post.id}
                                    score={post.score}
                                    subreddit={`r/${post.community.slug}`}
                                    communitySlug={post.community.slug}
                                    author={post.author.username}
                                    authorId={post.author.id}
                                    time={formatTimeAgo(new Date(post.createdAt))}
                                    title={post.title}
                                    content={post.content || ''}
                                    type={post.type}
                                    url={post.url || undefined}
                                    hasImage={post.type === 'image'}
                                    imageUrl={post.type === 'image' ? post.url || undefined : undefined}
                                    commentCount={post._count.comments}
                                    isVerified={post.author.reputation > 100}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-32">
                            <Coffee className="w-16 h-16 mx-auto mb-6 text-base-content/30" />
                            <h3 className="text-xl font-bold mb-2 text-base-content/70">
                                No {activeVibe === 'All' ? 'posts' : activeVibe.toLowerCase() + ' posts'} yet
                            </h3>
                            <p className="text-sm text-base-content/50">Check back soon or try a different vibe filter!</p>
                        </div>
                    )}
                </div>

            </div>

            <RightSidebarClient />
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import RisingPostCard from '@/components/Rising/RisingPostCard';
import RightSidebarClient from '@/components/Layout/RightSidebarClient';
import { TrendingUp, Flame, Activity, Hash } from 'lucide-react';

type RisingPost = {
    id: string;
    title: string;
    content: string | null;
    score: number;
    createdAt: string;
    velocity: number;
    author: { username: string };
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
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
}

export default function RisingPage() {
    const [posts, setPosts] = useState<RisingPost[]>([]);
    const [loading, setLoading] = useState(true);

    const trendingTopics = [
        { tag: '#SolarBreakthrough', count: '+405%' },
        { tag: '#IndieDevSummer', count: '+120%' },
        { tag: '#VintageSynth', count: '+85%' },
        { tag: '#SustainableLiving', count: '+60%' },
    ];

    useEffect(() => {
        async function fetchPosts() {
            setLoading(true);
            try {
                const res = await fetch('/api/posts/rising');
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

    return (
        <div className="flex gap-8 justify-center items-start pt-6">

            <div className="w-full max-w-3xl">

                {/* Header */}
                <div className="mb-8 flex items-center gap-3 motion-translate-x-in-[-20px] motion-opacity-in-[0%]">
                    <div className="p-3 bg-gradient-to-tr from-orange-500 to-yellow-400 rounded-xl text-white shadow-lg shadow-orange-500/20">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black">Rising</h1>
                        <p className="text-base-content/60 text-sm">Content with the highest <span className="text-orange-500 font-bold">Velocity</span> right now.</p>
                    </div>
                </div>

                {/* Trending Topic Cloud */}
                <div className="mb-8 bg-base-100 p-5 rounded-2xl border border-base-content/5 shadow-sm motion-scale-in-[0.98] motion-delay-[100ms]">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase text-base-content/40 tracking-wider">
                        <Activity className="w-4 h-4" /> Spiking Topics (Last hour)
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trendingTopics.map((topic, i) => (
                            <div key={i} className="badge badge-lg badge-outline gap-2 p-4 hover:bg-base-200 cursor-pointer transition-colors border-base-content/10 group">
                                <Hash className="w-3 h-3 opacity-30 group-hover:text-primary group-hover:opacity-100 transition-all" />
                                <span className="font-bold">{topic.tag.replace('#', '')}</span>
                                <span className="text-xs text-success font-mono bg-success/10 px-1 rounded">{topic.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rising Feed */}
                <div className="flex flex-col gap-3">
                    {loading ? (
                        <div className="text-center py-20 opacity-50">
                            <div className="loading loading-spinner loading-lg"></div>
                            <p className="mt-4">Loading rising posts...</p>
                        </div>
                    ) : posts.length > 0 ? (
                        posts.map((post, i) => (
                            <div key={post.id} className="motion-translate-y-in-[20px] motion-opacity-in-[0%] motion-delay-[200ms]">
                                <RisingPostCard
                                    rank={i + 1}
                                    subreddit={`r/${post.community.slug}`}
                                    author={post.author.username}
                                    title={post.title}
                                    previewText={post.content || ''}
                                    score={formatScore(post.score)}
                                    commentCount={post._count.comments}
                                    velocity={post.velocity}
                                    timeSince={formatTimeAgo(new Date(post.createdAt))}
                                    isGroundFloor={post.velocity > 50 && post.score < 100}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 opacity-50">
                            <Flame className="w-12 h-12 mx-auto mb-4" />
                            <p>No rising posts yet. Check back later!</p>
                        </div>
                    )}
                </div>

                <div className="text-center mt-8 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                    <button className="btn btn-ghost btn-xs">View Top 50 Rising</button>
                </div>

            </div>

            <RightSidebarClient />
        </div>
    );
}

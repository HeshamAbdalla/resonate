'use client';

import { TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Community = {
    id: string;
    name: string;
    slug: string;
    _count: { subscribers: number };
};

type Post = {
    id: string;
    title: string;
    community: { slug: string };
};

export default function RightSidebarClient() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [commRes, postsRes] = await Promise.all([
                    fetch('/api/communities'),
                    fetch('/api/posts/popular')
                ]);

                if (commRes.ok) {
                    const commData = await commRes.json();
                    setCommunities((commData.communities || commData).slice(0, 5));
                }
                if (postsRes.ok) {
                    const postsData = await postsRes.json();
                    setTrendingPosts((postsData.posts || postsData).slice(0, 3));
                }
            } catch (error) {
                console.error('Failed to fetch sidebar data:', error);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <aside className="hidden xl:flex flex-col w-80 gap-6">
                <div className="card bg-base-100 shadow-lg border border-base-content/5 animate-pulse">
                    <div className="card-body p-5">
                        <div className="h-4 bg-base-300 rounded w-1/2 mb-4"></div>
                        <div className="h-20 bg-base-300 rounded"></div>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="hidden xl:flex flex-col w-80 gap-6">

            {/* Trending Card */}
            <div className="card bg-base-100 shadow-lg border border-base-content/5">
                <div className="card-body p-5">
                    <h3 className="card-title text-base flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-secondary" />
                        Trending Now
                    </h3>

                    <div className="flex flex-col gap-4">
                        {trendingPosts.length > 0 ? (
                            trendingPosts.map((post) => (
                                <Link key={post.id} href={`/post/${post.id}`} className="group cursor-pointer hover:bg-base-200 -mx-2 p-2 rounded-lg transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="badge badge-xs badge-ghost uppercase font-bold tracking-wider">
                                            {post.community.slug} • Live
                                        </span>
                                        <ArrowUpRight className="w-3 h-3 text-base-content/50 group-hover:text-secondary transition-colors" />
                                    </div>
                                    <h4 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                        {post.title}
                                    </h4>
                                </Link>
                            ))
                        ) : (
                            <p className="text-sm opacity-50">No trending posts yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Communities Card */}
            <div className="card bg-base-100 shadow-lg border border-base-content/5">
                <div className="card-body p-5">
                    <h3 className="card-title text-base flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary" />
                        Communities
                    </h3>

                    <ul className="menu bg-base-100 w-full p-0 [&_li>*]:rounded-lg">
                        {communities.length > 0 ? (
                            communities.map((community) => (
                                <li key={community.id}>
                                    <Link href={`/community/r/${community.slug}`} className="gap-3 flex items-center">
                                        <div className="avatar placeholder">
                                            <div className="bg-neutral text-neutral-content rounded-full w-8">
                                                <span className="text-xs">{community.name[0]}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                            <span className="font-bold text-sm truncate">r/{community.slug}</span>
                                            <span className="text-[10px] opacity-60 font-medium">
                                                {community._count.subscribers} Members
                                            </span>
                                        </div>
                                        <button className="btn btn-xs btn-primary">Join</button>
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <li>
                                <span className="opacity-50">No communities yet</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 text-xs text-base-content/50">
                <div className="flex gap-3 flex-wrap mb-2">
                    <a className="link link-hover">Privacy</a>
                    <a className="link link-hover">Terms</a>
                    <Link href="/open-court" className="link link-hover">Open Court</Link>
                </div>
                <p>© 2025 Resonate Inc.</p>
            </div>

        </aside>
    );
}

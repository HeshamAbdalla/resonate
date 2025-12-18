'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Users,
    TrendingUp,
    Clock,
    SortAsc,
    Sparkles,
    Plus,
    Loader2,
    Filter,
    Grid3X3,
    List,
    MessageSquare
} from 'lucide-react';

interface Community {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    bannerImage: string | null;
    iconImage: string | null;
    createdAt: string;
    creator: { username: string };
    _count: { subscribers: number; posts: number };
}

const SORT_OPTIONS = [
    { id: 'popular', label: 'Popular', icon: TrendingUp },
    { id: 'new', label: 'Newest', icon: Clock },
    { id: 'active', label: 'Most Active', icon: MessageSquare },
    { id: 'alphabetical', label: 'A-Z', icon: SortAsc },
];

export default function ExplorePage() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('popular');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        async function fetchCommunities() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('sort', sort);
                if (search) params.set('search', search);

                const res = await fetch(`/api/communities?${params}`);
                const data = await res.json();
                setCommunities(data.communities || []);
            } catch (error) {
                console.error('Error fetching communities:', error);
            } finally {
                setLoading(false);
            }
        }

        const debounce = setTimeout(fetchCommunities, 300);
        return () => clearTimeout(debounce);
    }, [sort, search]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toString();
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Hero Header */}
            <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-4xl md:text-5xl font-black mb-4">
                    <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        Explore Communities
                    </span>
                </h1>
                <p className="text-base-content/60 text-lg max-w-2xl mx-auto">
                    Discover vibrant communities where ideas resonate and conversations thrive
                </p>
            </motion.div>

            {/* Search & Filters Bar */}
            <motion.div
                className="bg-base-100 rounded-2xl shadow-xl border border-base-content/5 p-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                        <input
                            type="text"
                            placeholder="Search communities..."
                            className="input input-bordered w-full pl-12 bg-base-200/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Sort Tabs */}
                    <div className="flex gap-2 flex-wrap">
                        {SORT_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSort(option.id)}
                                className={`btn btn-sm gap-2 ${sort === option.id
                                        ? 'btn-primary'
                                        : 'btn-ghost'
                                    }`}
                            >
                                <option.icon className="w-4 h-4" />
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-1 bg-base-200 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`btn btn-sm btn-square ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`btn btn-sm btn-square ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Create Community CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <Link href="/create-community">
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-6 flex items-center justify-between hover:from-primary/20 hover:to-secondary/20 transition-all group cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <Plus className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Create Your Community</h3>
                                <p className="text-sm text-base-content/60">Start a new space for your interests</p>
                            </div>
                        </div>
                        <Sparkles className="w-6 h-6 text-primary group-hover:rotate-12 transition-transform" />
                    </div>
                </Link>
            </motion.div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-base-content/60">
                    {loading ? 'Loading...' : `${communities.length} communities found`}
                </p>
            </div>

            {/* Communities Grid/List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : communities.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-base-100 rounded-2xl border border-base-content/5"
                >
                    <Search className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No communities found</h3>
                    <p className="text-base-content/60 mb-6">
                        {search ? `No results for "${search}"` : 'Be the first to create a community!'}
                    </p>
                    <Link href="/create-community" className="btn btn-primary">
                        Create Community
                    </Link>
                </motion.div>
            ) : viewMode === 'grid' ? (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.05 }
                        }
                    }}
                >
                    <AnimatePresence>
                        {communities.map((community, index) => (
                            <CommunityCard key={community.id} community={community} index={index} formatNumber={formatNumber} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <motion.div
                    className="space-y-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.03 }
                        }
                    }}
                >
                    <AnimatePresence>
                        {communities.map((community, index) => (
                            <CommunityListItem key={community.id} community={community} index={index} formatNumber={formatNumber} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}

// Grid Card Component
function CommunityCard({ community, index, formatNumber }: { community: Community; index: number; formatNumber: (n: number) => string }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
        >
            <Link href={`/community/r/${community.slug}`}>
                <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden hover:border-primary/50 hover:shadow-2xl transition-all group cursor-pointer h-full">
                    {/* Banner */}
                    <div className="h-24 bg-gradient-to-br from-primary/30 to-secondary/30 relative overflow-hidden">
                        {community.bannerImage && (
                            <img
                                src={community.bannerImage}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-base-100 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-5 pt-0 -mt-8 relative">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-xl bg-base-100 border-4 border-base-100 shadow-lg mb-3 overflow-hidden">
                            {community.iconImage ? (
                                <img src={community.iconImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                                    {community.name[0]}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                            r/{community.slug}
                        </h3>
                        <p className="text-sm text-base-content/60 mb-3 line-clamp-2 min-h-[2.5rem]">
                            {community.description || 'A community on Resonate'}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-base-content/60">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">{formatNumber(community._count.subscribers)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-base-content/60">
                                <MessageSquare className="w-4 h-4" />
                                <span>{formatNumber(community._count.posts)} posts</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// List Item Component
function CommunityListItem({ community, index, formatNumber }: { community: Community; index: number; formatNumber: (n: number) => string }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 }
            }}
        >
            <Link href={`/community/r/${community.slug}`}>
                <div className="card bg-base-100 shadow-lg border border-base-content/5 p-4 hover:border-primary/50 hover:shadow-xl transition-all group cursor-pointer">
                    <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                            {community.iconImage ? (
                                <img src={community.iconImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                                    {community.name[0]}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold group-hover:text-primary transition-colors">
                                r/{community.slug}
                            </h3>
                            <p className="text-sm text-base-content/60 truncate">
                                {community.description || 'A community on Resonate'}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm flex-shrink-0">
                            <div className="text-center">
                                <div className="font-bold">{formatNumber(community._count.subscribers)}</div>
                                <div className="text-xs text-base-content/50">members</div>
                            </div>
                            <div className="text-center">
                                <div className="font-bold">{formatNumber(community._count.posts)}</div>
                                <div className="text-xs text-base-content/50">posts</div>
                            </div>
                        </div>

                        {/* Join Button */}
                        <button className="btn btn-primary btn-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            View
                        </button>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

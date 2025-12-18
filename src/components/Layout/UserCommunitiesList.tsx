'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Loader2, Crown, Plus, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Community {
    id: string;
    name: string;
    slug: string;
    iconImage?: string | null;
    isOwner?: boolean;
}

const COLORS = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-pink-600', 'bg-cyan-600'];

export default function UserCommunitiesList() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        async function fetchCommunities() {
            try {
                const res = await fetch('/api/user/communities');
                if (res.ok) {
                    const data = await res.json();
                    setCommunities(data.communities || []);
                }
            } catch (error) {
                console.error('Failed to fetch communities:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchCommunities();
    }, []);

    const getColor = (index: number) => COLORS[index % COLORS.length];

    return (
        <div className="mb-2">
            {/* Header / Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full cursor-pointer p-2 rounded-lg hover:bg-base-200 text-xs font-bold text-base-content/60 uppercase tracking-wider transition-colors"
            >
                <span className="flex items.center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Your Communities
                </span>
                <span className="flex items-center gap-1">
                    {communities.length > 0 && (
                        <span className="badge badge-xs badge-ghost">{communities.length}</span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {/* Animated Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="mt-1 space-y-0.5 max-h-48 overflow-y-auto pr-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-base-content/40" />
                                </div>
                            ) : communities.length === 0 ? (
                                <div className="py-3 text-center">
                                    <p className="text-xs text-base-content/50 mb-2">No communities yet</p>
                                    <Link href="/explore" className="btn btn-xs btn-primary gap-1">
                                        <Plus className="w-3 h-3" />
                                        Explore
                                    </Link>
                                </div>
                            ) : (
                                communities.map((community, index) => (
                                    <motion.div
                                        key={community.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <Link
                                            href={`/community/r/${community.slug}`}
                                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-base-200 transition-colors group"
                                        >
                                            {/* Avatar */}
                                            {community.iconImage ? (
                                                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={community.iconImage}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className={`w-5 h-5 rounded-full ${getColor(index)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                                                    {community.name[0]}
                                                </div>
                                            )}

                                            {/* Name - no horizontal scroll */}
                                            <span className="text-sm truncate flex-1 min-w-0 group-hover:text-primary transition-colors">
                                                r/{community.slug}
                                            </span>

                                            {/* Owner badge */}
                                            {community.isOwner && (
                                                <Crown className="w-3 h-3 text-warning flex-shrink-0" />
                                            )}
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Create community link */}
                        {communities.length > 0 && (
                            <Link
                                href="/create-community"
                                className="flex items-center gap-2 px-2 py-1.5 mt-1 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Create Community
                            </Link>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

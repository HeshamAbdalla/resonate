'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Search, Check, Crown, Plus } from 'lucide-react';
import Link from 'next/link';

type Community = {
    id: string;
    name: string;
    slug: string;
    iconImage?: string | null;
    memberCount?: number;
    isOwner?: boolean;
};

const COLORS = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-pink-600', 'bg-cyan-600'];

interface CommunitySelectorProps {
    onSelect: (id: string) => void;
    initialSlug?: string;
}

export default function CommunitySelector({ onSelect, initialSlug }: CommunitySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selected, setSelected] = useState<Community | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCommunities() {
            try {
                // Fetch only communities user is a member of
                const res = await fetch('/api/user/communities');
                if (res.ok) {
                    const response = await res.json();
                    const data = response.communities || [];
                    setCommunities(data);

                    // If initial slug provided, find and select that community
                    if (initialSlug && Array.isArray(data)) {
                        const initial = data.find((c: Community) => c.slug === initialSlug);
                        if (initial) {
                            setSelected(initial);
                            onSelect(initial.id);
                        }
                    } else if (Array.isArray(data) && data.length > 0) {
                        setSelected(data[0]);
                        onSelect(data[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch communities:', error);
            }
            setLoading(false);
        }
        fetchCommunities();
    }, [initialSlug]);

    const filtered = communities.filter(c =>
        c.slug.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (c: Community) => {
        setSelected(c);
        onSelect(c.id);
        setIsOpen(false);
    };

    const getColor = (index: number) => COLORS[index % COLORS.length];

    if (loading) {
        return (
            <div className="btn btn-ghost bg-base-100 border border-base-content/10 w-full max-w-xs justify-between normal-case font-normal">
                <span className="loading loading-spinner loading-xs"></span>
                <span>Loading your communities...</span>
            </div>
        );
    }

    if (communities.length === 0) {
        return (
            <div className="bg-base-200/50 rounded-xl p-4 text-center">
                <p className="text-sm text-base-content/60 mb-2">You haven't joined any communities yet</p>
                <Link href="/explore" className="btn btn-primary btn-sm gap-2">
                    <Plus className="w-4 h-4" />
                    Explore Communities
                </Link>
            </div>
        );
    }

    if (!selected) {
        return (
            <div className="btn btn-ghost bg-base-100 border border-base-content/10 w-full max-w-xs justify-between normal-case font-normal opacity-50">
                Select a community
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-xs z-30">

            {/* Trigger */}
            <button
                className="btn btn-ghost bg-base-100 border border-base-content/10 w-full justify-between normal-case font-normal"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${getColor(communities.indexOf(selected))} flex items-center justify-center text-white text-xs font-bold`}>
                        {selected.name[0]}
                    </div>
                    <span className="font-bold">r/{selected.slug}</span>
                </div>
                <ChevronDown className="w-4 h-4 opacity-50" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-base-100 border border-base-content/10 shadow-xl rounded-xl overflow-hidden p-2">

                    <label className="input input-sm input-bordered flex items-center gap-2 mb-2 bg-base-200/50">
                        <Search className="w-3 h-3 opacity-50" />
                        <input
                            type="text"
                            className="grow placeholder:text-xs"
                            placeholder="Search communities..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </label>

                    <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                        {filtered.map((c, i) => (
                            <button
                                key={c.id}
                                className="btn btn-sm btn-ghost justify-start px-2 py-1 h-auto"
                                onClick={() => handleSelect(c)}
                            >
                                <div className={`w-6 h-6 rounded-full ${getColor(i)} flex items-center justify-center text-white text-xs font-bold`}>
                                    {c.name[0]}
                                </div>
                                <div className="flex flex-col items-start gap-0.5 ml-1">
                                    <span className="text-xs font-bold leading-none">r/{c.slug}</span>
                                    <span className="text-[10px] opacity-50 leading-none">{c.name}</span>
                                </div>
                                {selected.id === c.id && <Check className="w-3 h-3 text-primary ml-auto" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

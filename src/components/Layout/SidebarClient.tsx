'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Flame, TrendingUp, ChevronDown, MessageCircle, Shield,
    HelpCircle, FileText, Settings, Sparkles, Compass, Radio,
    MessageSquare, Wifi, RotateCcw, ArrowRight, LogIn, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import UserCommunitiesList from './UserCommunitiesList';
import { useLiveSignal } from '@/hooks/useLiveSignal';

interface UserProfile {
    username: string;
    image?: string | null;
}

interface LiveThread {
    id: string;
    title: string;
    communityName: string;
    communitySlug: string;
    repliesInLast30Min: number;
    isLive: boolean;
    heat: 'calm' | 'active' | 'heated';
}

interface ResumeConversation {
    postId: string;
    postTitle: string;
    communitySlug: string;
    newRepliesCount: number;
    directReplies: number;
    status: 'active' | 'heated' | 'quiet';
}

export default function SidebarClient() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [liveCount, setLiveCount] = useState(0);
    const [liveThreads, setLiveThreads] = useState<LiveThread[]>([]);
    const [resumeConversations, setResumeConversations] = useState<ResumeConversation[]>([]);
    const [resumeCount, setResumeCount] = useState(0);
    const [loadingLive, setLoadingLive] = useState(true);
    const [loadingResume, setLoadingResume] = useState(true);
    const [resumeOpen, setResumeOpen] = useState(true);

    // Fetch user authentication state
    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setUser(data.user);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        }
        fetchUser();
    }, []);

    // Real-time updates
    const { isConnected } = useLiveSignal({
        onActivity: useCallback(() => {
            fetchLiveThreads();
            if (user) {
                fetchResumeConversations();
            }
        }, [user]),
    });

    // Fetch live threads
    const fetchLiveThreads = useCallback(async () => {
        try {
            const res = await fetch('/api/posts/signal?filter=live&limit=3');
            if (res.ok) {
                const data = await res.json();
                setLiveCount(data.liveCount || 0);
                setLiveThreads(
                    (data.posts || []).slice(0, 3).map((p: {
                        id: string;
                        title: string;
                        community: { name: string; slug: string };
                        repliesInLast30Min?: number;
                        isLive?: boolean;
                    }) => ({
                        id: p.id,
                        title: p.title.length > 35 ? p.title.slice(0, 35) + '...' : p.title,
                        communityName: p.community.name,
                        communitySlug: p.community.slug,
                        repliesInLast30Min: p.repliesInLast30Min || 0,
                        isLive: p.isLive || false,
                        heat: (p.repliesInLast30Min || 0) >= 5 ? 'heated' : (p.repliesInLast30Min || 0) >= 2 ? 'active' : 'calm',
                    }))
                );
            }
        } catch (e) {
            console.error('Failed to fetch live threads:', e);
        } finally {
            setLoadingLive(false);
        }
    }, []);

    // Fetch resume conversations (only if authenticated)
    const fetchResumeConversations = useCallback(async () => {
        if (!user) {
            setLoadingResume(false);
            return;
        }
        try {
            const res = await fetch('/api/user/resume?limit=3');
            if (res.ok) {
                const data = await res.json();
                setResumeCount(data.totalActive || 0);
                setResumeConversations(
                    (data.conversations || []).map((c: {
                        postId: string;
                        postTitle: string;
                        communitySlug: string;
                        newRepliesCount: number;
                        directReplies: number;
                        status: 'active' | 'heated' | 'quiet';
                    }) => ({
                        postId: c.postId,
                        postTitle: c.postTitle,
                        communitySlug: c.communitySlug,
                        newRepliesCount: c.newRepliesCount,
                        directReplies: c.directReplies,
                        status: c.status,
                    }))
                );
            }
        } catch (e) {
            console.error('Failed to fetch resume conversations:', e);
        } finally {
            setLoadingResume(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLiveThreads();
        fetchResumeConversations();

        // Refresh every 60 seconds
        const interval = setInterval(() => {
            fetchLiveThreads();
            fetchResumeConversations();
        }, 60000);
        return () => clearInterval(interval);
    }, [fetchLiveThreads, fetchResumeConversations]);

    // Heat indicator colors
    const getHeatColor = (heat: 'calm' | 'active' | 'heated') => {
        switch (heat) {
            case 'heated': return 'bg-error';
            case 'active': return 'bg-warning';
            default: return 'bg-success';
        }
    };

    // Status indicator
    const getStatusStyle = (status: 'active' | 'heated' | 'quiet') => {
        switch (status) {
            case 'heated': return { color: 'text-error', bg: 'bg-error/10', border: 'border-l-error' };
            case 'active': return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning' };
            default: return { color: 'text-base-content/40', bg: 'bg-base-200', border: 'border-l-base-content/20' };
        }
    };

    return (
        <div className="h-full w-full bg-base-100 lg:bg-transparent p-4 overflow-y-auto custom-scrollbar">

            {/* Auth Prompt for Unauthenticated Users */}
            {!user && (
                <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-xs text-base-content/70 mb-3">Sign in to unlock all features</p>
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/login"
                            className="btn btn-sm btn-primary gap-2 w-full"
                        >
                            <LogIn className="w-4 h-4" />
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="btn btn-sm btn-outline btn-primary gap-2 w-full"
                        >
                            <UserPlus className="w-4 h-4" />
                            Register
                        </Link>
                    </div>
                </div>
            )}

            {/* Main Navigation */}
            <ul className="menu menu-md p-0 mb-4">
                <li>
                    <Link href="/" className="active:bg-primary/20 hover:bg-base-200 font-medium">
                        <Home className="w-5 h-5" />
                        Home
                    </Link>
                </li>
                <li>
                    <Link
                        href="/signal"
                        className="hover:bg-primary/15 font-semibold text-primary bg-primary/10 rounded-lg relative group"
                    >
                        <Sparkles className="w-5 h-5" />
                        <span className="flex-1">Signal Feed</span>
                        {liveCount > 0 && (
                            <span className="badge badge-sm badge-primary gap-1">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-content opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-content"></span>
                                </span>
                                {liveCount} active
                            </span>
                        )}
                        {!liveCount && <span className="badge badge-xs badge-primary">NEW</span>}
                    </Link>
                </li>
                <li>
                    <Link href="/popular" className="hover:bg-base-200 font-medium">
                        <Flame className="w-5 h-5" />
                        Popular
                    </Link>
                </li>
                <li>
                    <Link href="/rising" className="hover:bg-base-200 font-medium">
                        <TrendingUp className="w-5 h-5" />
                        Rising
                    </Link>
                </li>
                <li className="group">
                    <Link href="/explore" className="hover:bg-base-200 font-medium text-primary flex-col items-start gap-0">
                        <span className="flex items-center gap-3 w-full">
                            <Compass className="w-5 h-5" />
                            Explore
                        </span>
                        <span className="text-[10px] text-base-content/40 ml-8 -mt-1 group-hover:text-primary/60">
                            Find new conversations
                        </span>
                    </Link>
                </li>
                {/* Messages - Only for authenticated users */}
                {user && (
                    <li>
                        <Link href="/messages" className="hover:bg-base-200 font-medium">
                            <MessageCircle className="w-5 h-5" />
                            Messages
                        </Link>
                    </li>
                )}
            </ul>

            <div className="divider my-0 mb-3 h-px bg-base-content/5"></div>

            {/* RESUME Section - Only for authenticated users */}
            {user && resumeCount > 0 && (
                <>
                    <div className="mb-3">
                        <button
                            onClick={() => setResumeOpen(!resumeOpen)}
                            className="flex items-center justify-between w-full px-2 mb-2"
                        >
                            <span className="flex items-center gap-2 text-xs font-bold text-cyan-500 uppercase tracking-wider">
                                <RotateCcw className="w-3.5 h-3.5" />
                                Resume
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="badge badge-sm badge-info gap-1">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-info-content opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-info-content"></span>
                                    </span>
                                    {resumeCount} active
                                </span>
                                <ChevronDown className={`w-4 h-4 text-base-content/40 transition-transform duration-200 ${resumeOpen ? 'rotate-180' : ''}`} />
                            </span>
                        </button>

                        <AnimatePresence initial={false}>
                            {resumeOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-1.5">
                                        {loadingResume ? (
                                            <div className="px-2 py-2 text-xs text-base-content/40">Loading...</div>
                                        ) : resumeConversations.length > 0 ? (
                                            resumeConversations.map((conv, idx) => {
                                                const style = getStatusStyle(conv.status);
                                                return (
                                                    <motion.div
                                                        key={conv.postId}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                    >
                                                        <Link
                                                            href={`/post/${conv.postId}?resume=true`}
                                                            className={`flex items-start gap-2 px-2 py-2 rounded-lg border-l-2 ${style.border} ${style.bg} hover:brightness-95 transition-all group`}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                    <span className="text-xs font-medium truncate">
                                                                        {conv.postTitle}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-base-content/50">
                                                                    <span>r/{conv.communitySlug}</span>
                                                                    {conv.directReplies > 0 && (
                                                                        <span className="text-primary font-medium">
                                                                            {conv.directReplies} direct
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-0.5">
                                                                <span className={`text-xs font-semibold ${style.color}`}>
                                                                    {conv.newRepliesCount} new
                                                                </span>
                                                                <ArrowRight className="w-3 h-3 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                                            </div>
                                                        </Link>
                                                    </motion.div>
                                                );
                                            })
                                        ) : (
                                            <div className="px-2 py-2 text-xs text-base-content/40">
                                                No conversations waiting
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="divider my-0 mb-3 h-px bg-base-content/5"></div>
                </>
            )}

            {/* LIVE NOW Section */}
            {liveCount > 0 && (
                <>
                    <div className="mb-3">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <span className="flex items-center gap-2 text-xs font-bold text-error/80 uppercase tracking-wider">
                                <Radio className="w-3.5 h-3.5 animate-pulse" />
                                Live Now
                            </span>
                            {isConnected && (
                                <span className="flex items-center gap-1 text-[10px] text-success/60">
                                    <Wifi className="w-2.5 h-2.5" />
                                </span>
                            )}
                        </div>
                        <ul className="menu menu-sm p-0">
                            {loadingLive ? (
                                <li className="px-2 py-1 text-xs text-base-content/40">Loading...</li>
                            ) : liveThreads.length > 0 ? (
                                liveThreads.map((thread) => (
                                    <li key={thread.id}>
                                        <Link
                                            href={`/post/${thread.id}`}
                                            className="gap-2 py-1.5 hover:bg-error/10"
                                        >
                                            <span className={`relative flex h-2 w-2 ${getHeatColor(thread.heat)} rounded-full`}>
                                                {thread.heat === 'heated' && (
                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${getHeatColor(thread.heat)} opacity-75`}></span>
                                                )}
                                            </span>
                                            <span className="flex-1 truncate text-xs font-medium">
                                                {thread.title}
                                            </span>
                                            <span className="text-[10px] text-base-content/40">
                                                r/{thread.communitySlug}
                                            </span>
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <li className="px-2 py-1 text-xs text-base-content/40">
                                    No live threads right now
                                </li>
                            )}
                        </ul>
                    </div>
                    <div className="divider my-0 mb-3 h-px bg-base-content/5"></div>
                </>
            )}

            {/* YOUR COMMUNITIES (Dynamic) */}
            <UserCommunitiesList />

            {/* FEATURED */}
            <details className="group mb-2">
                <summary className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-base-200 text-xs font-bold text-base-content/60 uppercase tracking-wider transition-colors list-none">
                    Featured
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="menu menu-sm p-0 mt-1 motion-opacity-in-[0%] motion-translate-y-in-[-5px] motion-duration-[0.3s] motion-ease-spring-smooth">
                    <li>
                        <Link href="/open-court" className="gap-3 text-warning">
                            <Shield className="w-5 h-5" />
                            Open Court Jury
                        </Link>
                    </li>
                </ul>
            </details>

            {/* RESOURCES */}
            <details className="group mb-4">
                <summary className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-base-200 text-xs font-bold text-base-content/60 uppercase tracking-wider transition-colors list-none">
                    Resources
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="menu menu-sm p-0 mt-1 motion-opacity-in-[0%] motion-translate-y-in-[-5px] motion-duration-[0.3s] motion-ease-spring-smooth">
                    <li>
                        <Link href="/about">
                            <div className="flex items-center gap-3">
                                <HelpCircle className="w-5 h-5" />
                                About Resonate
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/manifesto">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5" />
                                Manifesto
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/settings">
                            <div className="flex items-center gap-3">
                                <Settings className="w-5 h-5" />
                                Settings
                            </div>
                        </Link>
                    </li>
                </ul>
            </details>

            <div className="divider my-0 mb-4 h-px bg-base-content/5"></div>

            <div className="px-4 text-[10px] text-base-content/40 leading-relaxed">
                Resonate Inc © 2025. <br />
                Built for the future of discourse.
            </div>

        </div>
    );
}

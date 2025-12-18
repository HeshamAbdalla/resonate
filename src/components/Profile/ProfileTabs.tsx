'use client';

import { useState, useEffect } from 'react';
import { Bookmark, FileText, MessageSquare, ThumbsUp, ThumbsDown, Users, Loader2 } from 'lucide-react';
import PostCard from '@/components/Feed/PostCard';
import Link from 'next/link';

interface Post {
    id: string;
    title: string;
    content: string | null;
    type: string;
    url: string | null;
    score: number;
    createdAt: string;
    author: { username: string; reputation: number };
    community: { slug: string };
    _count: { comments: number };
}

interface Comment {
    id: string;
    content: string;
    score: number;
    createdAt: string;
    post: {
        id: string;
        title: string;
        community: { slug: string };
    };
}

interface Community {
    id: string;
    name: string;
    slug: string;
    iconImage?: string;
    _count?: { subscribers: number };
    isCreator?: boolean;
}

interface ProfileTabsProps {
    initialPosts: Post[];
    userId: string;
}

type TabType = 'posts' | 'comments' | 'saved' | 'upvoted' | 'downvoted' | 'communities';

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

export default function ProfileTabs({ initialPosts, userId }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [upvotedPosts, setUpvotedPosts] = useState<Post[]>([]);
    const [downvotedPosts, setDownvotedPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);

    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState<Set<TabType>>(new Set(['posts']));

    // Load data when switching tabs
    useEffect(() => {
        if (loaded.has(activeTab)) return;

        async function fetchData() {
            setLoading(true);
            try {
                let endpoint = '';
                switch (activeTab) {
                    case 'saved':
                        endpoint = '/api/user/saved';
                        break;
                    case 'comments':
                        endpoint = '/api/user/comments';
                        break;
                    case 'upvoted':
                        endpoint = '/api/user/votes?type=UP';
                        break;
                    case 'downvoted':
                        endpoint = '/api/user/votes?type=DOWN';
                        break;
                    case 'communities':
                        endpoint = '/api/user/communities';
                        break;
                    default:
                        return;
                }

                const res = await fetch(endpoint);
                if (res.ok) {
                    const data = await res.json();
                    switch (activeTab) {
                        case 'saved':
                            setSavedPosts(data.posts || []);
                            break;
                        case 'comments':
                            setComments(data.comments || []);
                            break;
                        case 'upvoted':
                            setUpvotedPosts(data.posts || []);
                            break;
                        case 'downvoted':
                            setDownvotedPosts(data.posts || []);
                            break;
                        case 'communities':
                            setCommunities(data.communities || []);
                            break;
                    }
                    setLoaded(prev => new Set(prev).add(activeTab));
                }
            } catch (error) {
                console.error(`Error fetching ${activeTab}:`, error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [activeTab, loaded]);

    const tabs = [
        { id: 'posts' as TabType, label: 'Posts', icon: FileText, count: posts.length },
        { id: 'comments' as TabType, label: 'Comments', icon: MessageSquare, count: comments.length },
        { id: 'saved' as TabType, label: 'Saved', icon: Bookmark, count: savedPosts.length },
        { id: 'upvoted' as TabType, label: 'Upvoted', icon: ThumbsUp, count: upvotedPosts.length },
        { id: 'downvoted' as TabType, label: 'Downvoted', icon: ThumbsDown, count: downvotedPosts.length },
        { id: 'communities' as TabType, label: 'Communities', icon: Users, count: communities.length },
    ];

    const getDisplayPosts = () => {
        switch (activeTab) {
            case 'posts': return posts;
            case 'saved': return savedPosts;
            case 'upvoted': return upvotedPosts;
            case 'downvoted': return downvotedPosts;
            default: return [];
        }
    };

    const displayPosts = getDisplayPosts();

    return (
        <div>
            {/* Tabs */}
            <div className="mb-6 border-b border-base-content/10">
                <div className="flex gap-1 overflow-x-auto pb-px">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-3 px-4 border-b-2 font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-base-content/60 hover:text-base-content hover:border-base-content/30'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            {loaded.has(tab.id) && tab.count > 0 && (
                                <span className={`badge badge-sm ${activeTab === tab.id ? 'badge-primary' : 'badge-ghost'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Comments Tab */}
                    {activeTab === 'comments' && (
                        comments.length === 0 ? (
                            <div className="text-center py-12 bg-base-100 rounded-2xl border border-base-content/10">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                                <p className="text-base-content/60">No comments yet.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {comments.map(comment => (
                                    <Link
                                        key={comment.id}
                                        href={`/post/${comment.post.id}`}
                                        className="card bg-base-100 p-4 border border-base-content/10 hover:border-primary/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 text-xs text-base-content/60 mb-2">
                                            <span>r/{comment.post.community.slug}</span>
                                            <span>•</span>
                                            <span className="line-clamp-1">{comment.post.title}</span>
                                        </div>
                                        <p className="text-sm line-clamp-3 mb-2">{comment.content}</p>
                                        <div className="flex items-center gap-4 text-xs text-base-content/50">
                                            <span className={comment.score > 0 ? 'text-success' : comment.score < 0 ? 'text-error' : ''}>
                                                {comment.score > 0 ? '+' : ''}{comment.score} points
                                            </span>
                                            <span>{formatTimeAgo(comment.createdAt)}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )
                    )}

                    {/* Communities Tab */}
                    {activeTab === 'communities' && (
                        communities.length === 0 ? (
                            <div className="text-center py-12 bg-base-100 rounded-2xl border border-base-content/10">
                                <Users className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                                <p className="text-base-content/60 mb-4">You haven't joined any communities.</p>
                                <Link href="/explore" className="btn btn-primary btn-sm">Explore Communities</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {communities.map(community => (
                                    <Link
                                        key={community.id}
                                        href={`/community/r/${community.slug}`}
                                        className="card bg-base-100 p-4 border border-base-content/10 hover:border-primary/30 transition-colors flex flex-row items-center gap-4"
                                    >
                                        {community.iconImage ? (
                                            <img src={community.iconImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                                                {community.name[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate">r/{community.slug}</p>
                                            <p className="text-xs text-base-content/60">{community.name}</p>
                                            {community.isCreator && (
                                                <span className="badge badge-primary badge-xs mt-1">Creator</span>
                                            )}
                                        </div>
                                        {community._count && (
                                            <span className="text-xs text-base-content/50">
                                                {community._count.subscribers} members
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )
                    )}

                    {/* Posts-based Tabs */}
                    {['posts', 'saved', 'upvoted', 'downvoted'].includes(activeTab) && (
                        displayPosts.length === 0 ? (
                            <div className="text-center py-12 bg-base-100 rounded-2xl border border-base-content/10">
                                {activeTab === 'posts' && (
                                    <>
                                        <FileText className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                                        <p className="text-base-content/60 mb-4">You haven't posted anything yet.</p>
                                        <Link href="/submit" className="btn btn-primary btn-sm">Create your first post</Link>
                                    </>
                                )}
                                {activeTab === 'saved' && (
                                    <>
                                        <Bookmark className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                                        <p className="text-base-content/60">No saved posts yet.</p>
                                        <p className="text-base-content/40 text-sm mt-1">
                                            Click the bookmark icon on posts to save them here.
                                        </p>
                                    </>
                                )}
                                {activeTab === 'upvoted' && (
                                    <>
                                        <ThumbsUp className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                                        <p className="text-base-content/60">No upvoted posts yet.</p>
                                    </>
                                )}
                                {activeTab === 'downvoted' && (
                                    <>
                                        <ThumbsDown className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                                        <p className="text-base-content/60">No downvoted posts yet.</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {displayPosts.map((post) => (
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
                                    />
                                ))}
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
}

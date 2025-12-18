'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquarePlus, Sparkles } from 'lucide-react';
import PostCard from '@/components/Feed/PostCard';
import ModPostActions from '@/components/Community/ModPostActions';

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
    createdAt: Date;
    author: { username: string; reputation: number };
    community: { slug: string; id: string; creatorId: string };
    _count: { comments: number };
}

interface CommunityPostListProps {
    posts: Post[];
    communityId: string;
    creatorId: string;
    communitySlug: string;
}

function formatScore(score: number): string {
    if (score >= 1000) {
        return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
}

export default function CommunityPostList({ posts, communityId, creatorId, communitySlug }: CommunityPostListProps) {
    const [isCreator, setIsCreator] = useState(false);

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

    // Sort posts: pinned first, then by score
    const sortedPosts = [...posts].sort((a, b) => {
        if (a.isPinnedInCommunity && !b.isPinnedInCommunity) return -1;
        if (!a.isPinnedInCommunity && b.isPinnedInCommunity) return 1;
        return b.score - a.score;
    });

    if (posts.length === 0) {
        return (
            <div className="bg-base-100 rounded-2xl border border-base-content/10 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No posts yet</h3>
                <p className="text-base-content/60 mb-6 max-w-md mx-auto">
                    This community is waiting for its first post. Be the one to start the conversation!
                </p>
                <Link
                    href={`/submit?community=${communitySlug}`}
                    className="btn btn-primary gap-2"
                >
                    <MessageSquarePlus className="w-5 h-5" />
                    Create First Post
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {sortedPosts.map((post) => (
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
    );
}

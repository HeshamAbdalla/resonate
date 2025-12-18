export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/Profile/ProfileHeader';
import ProfileTabs from '@/components/Profile/ProfileTabs';
import RightSidebar from '@/components/Layout/RightSidebar';
import prisma from '@/lib/db';
import { Suspense } from 'react';

interface PageProps {
    params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
    const { username } = await params;

    // Get user profile from database
    const profile = await prisma.user.findUnique({
        where: { username },
        include: {
            posts: {
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: {
                    author: {
                        select: { username: true, reputation: true },
                    },
                    community: {
                        select: { slug: true },
                    },
                    _count: {
                        select: { comments: true },
                    },
                },
            },
            _count: {
                select: {
                    posts: true,
                    comments: true,
                    followers: true,
                    following: true,
                },
            },
        },
    });

    if (!profile) {
        notFound();
    }

    // Calculate total score across all posts
    const totalScore = profile.posts.reduce((sum: number, post: typeof profile.posts[number]) => sum + post.score, 0);

    // Serialize posts for client component
    const serializedPosts = profile.posts.map((post: typeof profile.posts[number]) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type,
        url: post.url,
        score: post.score,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
        community: post.community,
        _count: post._count,
    }));

    return (
        <div className="flex gap-8 justify-center items-start flex-wrap lg:flex-nowrap">

            <div className="w-full max-w-4xl">
                <ProfileHeader
                    username={profile.username}
                    name={profile.name || undefined}
                    bio={profile.bio || undefined}
                    image={profile.image || undefined}
                    bannerImage={profile.bannerImage || undefined}
                    reputation={profile.reputation}
                    postCount={profile._count.posts}
                    commentCount={profile._count.comments}
                    totalScore={totalScore}
                    joinedAt={profile.createdAt}
                    isOwnProfile={false}
                    initialFollowersCount={profile._count.followers}
                    initialFollowingCount={profile._count.following}
                />

                <ProfileTabs
                    initialPosts={serializedPosts}
                    userId={profile.id}
                />
            </div>

            <div className="hidden xl:block">
                <Suspense fallback={<div className="w-80 h-96 bg-base-200 animate-pulse rounded-xl"></div>}>
                    <RightSidebar />
                </Suspense>
            </div>

        </div>
    );
}

import ProfileHeader from '@/components/Profile/ProfileHeader';
import ProfileTabs from '@/components/Profile/ProfileTabs';
import RightSidebar from '@/components/Layout/RightSidebar';
import { getPostsByUser } from '@/lib/actions/posts';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile from database with follower counts and stats
    const profile = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            _count: {
                select: {
                    followers: true,
                    following: true,
                    comments: true,
                },
            },
        },
    });

    if (!profile) {
        redirect('/onboarding');
    }

    // Get user's posts with scores
    const posts = await getPostsByUser(user.id);

    // Calculate total score across all posts
    const totalScore = posts.reduce((sum, post) => sum + post.score, 0);

    // Serialize posts for client component
    const serializedPosts = posts.map(post => ({
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
                    postCount={posts.length}
                    commentCount={profile._count.comments}
                    totalScore={totalScore}
                    joinedAt={profile.createdAt}
                    isOwnProfile={true}
                    initialFollowersCount={profile._count.followers}
                    initialFollowingCount={profile._count.following}
                />

                <ProfileTabs
                    initialPosts={serializedPosts}
                    userId={user.id}
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

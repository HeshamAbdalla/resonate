export const dynamic = 'force-dynamic';

import CommunityHeader from '@/components/Community/CommunityHeader';
import CommunitySidebar from '@/components/Community/CommunitySidebar';
import ModLogWidget from '@/components/Community/ModLogWidget';
import CommunityFeed from '@/components/Community/CommunityFeed';
import CommunityChat from '@/components/Community/CommunityChat';
import { getCommunityBySlug } from '@/lib/actions/communities';
import { getPosts } from '@/lib/actions/posts';
import { notFound } from 'next/navigation';

export default async function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const communitySlug = decodeURIComponent(id);

    const community = await getCommunityBySlug(communitySlug);

    if (!community) {
        notFound();
    }

    const posts = await getPosts({ communitySlug, sort: 'hot', limit: 20 });

    // Serialize posts for client component
    const serializedPosts = posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type,
        url: post.url,
        score: post.score,
        isPinnedInCommunity: (post as any).isPinnedInCommunity || false,
        isLocked: (post as any).isLocked || false,
        isNSFW: (post as any).isNSFW || false,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
        community: {
            ...post.community,
            creatorId: community.creator.id,
        },
        _count: post._count,
    }));

    return (
        <div className="flex gap-8 justify-center items-start flex-wrap lg:flex-nowrap">

            <div className="w-full max-w-4xl">

                <CommunityHeader
                    communityId={community.id}
                    name={`r/${community.slug}`}
                    title={community.name}
                    members={community._count.subscribers.toString()}
                    active={'0'}
                    description={community.description || 'No description yet.'}
                    bannerImage={community.bannerImage}
                    iconImage={community.iconImage}
                    rules={community.rules}
                    createdAt={community.createdAt}
                    creatorName={community.creator.username}
                    creatorId={community.creator.id}
                />

                {/* Feed with Sorting & Search */}
                <CommunityFeed
                    communitySlug={community.slug}
                    communityId={community.id}
                    creatorId={community.creator.id}
                    initialPosts={serializedPosts}
                />

            </div>

            {/* Community Sidebar */}
            <div className="hidden xl:block w-80 space-y-4">
                <CommunitySidebar
                    communityId={community.id}
                    name={community.name}
                    slug={community.slug}
                    description={community.description}
                    rules={community.rules}
                    memberCount={community._count.subscribers}
                    postCount={community._count.posts}
                    createdAt={community.createdAt}
                    creatorName={community.creator.username}
                />

                {/* Public Mod Log - Transparency Feature! */}
                <ModLogWidget communityId={community.id} />
            </div>

            {/* Live Chat Widget */}
            <CommunityChat communitySlug={community.slug} communityName={community.name} />

        </div>
    );
}

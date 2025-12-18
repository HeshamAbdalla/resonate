export const dynamic = 'force-dynamic';

import PostCard from '@/components/Feed/PostCard';
import SignalFeedPreview from '@/components/Feed/SignalFeedPreview';
import RightSidebar from '@/components/Layout/RightSidebar';
import { getPosts } from '@/lib/actions/posts';
import { Suspense } from 'react';

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SidebarFallback() {
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

export default async function Home() {
  const posts = await getPosts({ sort: 'hot', limit: 10 });

  return (
    <div className="flex gap-8 justify-center items-start flex-wrap lg:flex-nowrap">
      {/* Feed Column */}
      <div className="w-full max-w-3xl">

        {/* Signal Feed Highlight - Shows top conversation */}
        <SignalFeedPreview />

        {/* FlyonUI Tabs */}
        <div role="tablist" className="tabs tabs-boxed bg-base-100 mb-6 p-2 rounded-full shadow-sm">
          <a role="tab" className="tab tab-active">In Harmony</a>
          <a role="tab" className="tab">Rising Tides</a>
          <a role="tab" className="tab">Controversial</a>
          <a role="tab" className="tab">Newest Echoes</a>
        </div>

        {/* Posts */}
        <div className="flex flex-col gap-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                score={post.score}
                subreddit={`r/${post.community.slug}`}
                communitySlug={post.community.slug}
                author={post.author.username}
                authorId={post.author.id}
                time={formatTimeAgo(new Date(post.createdAt))}
                title={post.title}
                content={post.content || ''}
                type={post.type}
                url={post.url || undefined}
                hasImage={post.type === 'image'}
                imageUrl={post.type === 'image' ? post.url || undefined : undefined}
                commentCount={post._count.comments}
                isVerified={post.author.reputation > 100}
              />
            ))
          ) : (
            <div className="text-center py-20 opacity-50">
              <p>No posts yet. Be the first to create one!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <Suspense fallback={<SidebarFallback />}>
        <RightSidebar />
      </Suspense>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Bookmark, Clock, ExternalLink, Shield } from 'lucide-react';
import { getPostById } from '@/lib/actions/post';
import CommentsList from '@/components/Post/CommentsList';
import VoteButtons from '@/components/Post/VoteButtons';
import PostReactions from '@/components/Post/PostReactions';
import ShareModal from '@/components/Post/ShareModal';
import PostSettingsDropdown from '@/components/Post/PostSettingsDropdown';
import FollowConversationButton from '@/components/Post/FollowConversationButton';
import PostPageClient from '@/components/Post/PostPageClient';

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

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = await getPostById(id);

    if (!post) {
        notFound();
    }

    return (
        <div className="flex gap-8 justify-center items-start pt-4">
            <div className="w-full max-w-3xl">

                {/* Back Navigation */}
                <Link
                    href={`/community/r/${post.community.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-primary transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to r/{post.community.slug}
                </Link>

                {/* Main Post Card */}
                <article className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden mb-8">
                    <div className="flex">
                        {/* Vote Column */}
                        <div className="flex flex-col items-center p-4 bg-gradient-to-b from-base-200/50 to-base-200/30 min-w-[4rem]">
                            <VoteButtons
                                postId={post.id}
                                initialScore={post.score}
                                size="lg"
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6">
                            {/* Meta */}
                            <div className="flex items-center gap-2 text-sm text-base-content/60 mb-4 flex-wrap">
                                {post.community.iconImage ? (
                                    <img src={post.community.iconImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                                        {post.community.name[0]}
                                    </div>
                                )}
                                <Link
                                    href={`/community/r/${post.community.slug}`}
                                    className="font-bold text-base-content hover:text-primary transition-colors"
                                >
                                    r/{post.community.slug}
                                </Link>
                                <span className="text-base-content/30">•</span>
                                <span>
                                    Posted by{' '}
                                    <Link
                                        href={`/user/${post.author.username}`}
                                        className="hover:underline hover:text-primary transition-colors"
                                    >
                                        u/{post.author.username}
                                    </Link>
                                </span>
                                {post.author.reputation > 100 && (
                                    <span className="badge badge-xs badge-primary gap-1">
                                        <Shield className="w-2.5 h-2.5" />
                                        Trusted
                                    </span>
                                )}
                                <span className="text-base-content/30">•</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatTimeAgo(post.createdAt)}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight tracking-tight">
                                {post.title}
                            </h1>

                            {/* Content */}
                            {post.content && (
                                <div className="prose prose-base max-w-none mb-6 text-base-content/85">
                                    <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
                                </div>
                            )}

                            {/* Link */}
                            {post.url && (
                                <a
                                    href={post.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-primary hover:underline mb-6 p-4 bg-primary/5 rounded-xl border border-primary/20"
                                >
                                    <ExternalLink className="w-5 h-5 flex-shrink-0" />
                                    <span className="truncate">{post.url}</span>
                                </a>
                            )}

                            {/* Reactions */}
                            <div className="mb-6">
                                <PostReactions postId={post.id} />
                            </div>

                            {/* Actions Bar */}
                            <div className="flex items-center gap-2 pt-4 border-t border-base-content/10 flex-wrap">
                                <button className="btn btn-ghost btn-sm gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    {post._count.comments} Comments
                                </button>
                                <ShareModal
                                    postId={post.id}
                                    title={post.title}
                                    communitySlug={post.community.slug}
                                />
                                <button className="btn btn-ghost btn-sm gap-2">
                                    <Bookmark className="w-4 h-4" />
                                    Save
                                </button>
                                <FollowConversationButton postId={post.id} />
                                <div className="ml-auto">
                                    <PostSettingsDropdown
                                        postId={post.id}
                                        authorId={post.author.id}
                                        communitySlug={post.community.slug}
                                        initialIsPinned={post.isPinned}
                                        initialCommentsDisabled={post.commentsDisabled}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </article>

                {/* Comments Section */}
                <div className="card bg-base-100 shadow-xl border border-base-content/5 p-6">
                    {post.commentsDisabled ? (
                        <div className="text-center py-8 text-base-content/50">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Comments are disabled</p>
                            <p className="text-sm">The author has disabled comments on this post.</p>
                        </div>
                    ) : (
                        <CommentsList
                            postId={post.id}
                            initialCommentCount={post._count.comments}
                        />
                    )}
                </div>
            </div>

            {/* Right Sidebar - Community Info */}
            <aside className="hidden xl:block w-80 sticky top-20 space-y-4">
                {/* Community Card */}
                <div className="card bg-base-100 shadow-lg border border-base-content/5 overflow-hidden">
                    {/* Header with gradient */}
                    <div className="h-16 bg-gradient-to-r from-primary/20 to-secondary/20" />

                    <div className="p-5 -mt-8">
                        <div className="flex items-end gap-3 mb-4">
                            {post.community.iconImage ? (
                                <img
                                    src={post.community.iconImage}
                                    alt=""
                                    className="w-14 h-14 rounded-xl border-4 border-base-100 object-cover shadow-lg"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl border-4 border-base-100 shadow-lg">
                                    {post.community.name[0]}
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold">r/{post.community.slug}</h3>
                                <p className="text-xs text-base-content/50">{post.community.name}</p>
                            </div>
                        </div>

                        <Link
                            href={`/community/r/${post.community.slug}`}
                            className="btn btn-primary btn-block"
                        >
                            View Community
                        </Link>
                    </div>
                </div>

                {/* Author Card */}
                <div className="card bg-base-100 shadow-lg border border-base-content/5 p-5">
                    <h4 className="text-sm font-bold text-base-content/60 mb-3">Posted by</h4>
                    <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent text-white">
                                {post.author.image ? (
                                    <img src={post.author.image} alt={post.author.username} />
                                ) : (
                                    <span>{post.author.username[0]?.toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <Link
                                href={`/user/${post.author.username}`}
                                className="font-bold hover:text-primary transition-colors"
                            >
                                u/{post.author.username}
                            </Link>
                            <p className="text-xs text-base-content/50">
                                {post.author.reputation} reputation
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}

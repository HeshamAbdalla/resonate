import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

interface FollowedPostData {
    postId: string;
    lastViewedAt: Date;
    lastSeenCount: number;
}

interface CommentData {
    id: string;
    content: string;
    createdAt: Date;
    authorId: string;
    parentId: string | null;
    author: {
        id: string;
        username: string;
        image: string | null;
    };
}

interface PostData {
    id: string;
    title: string;
    createdAt: Date;
    community: {
        id: string;
        slug: string;
        name: string;
    };
    author: {
        id: string;
        username: string;
    };
    comments: CommentData[];
    _count: {
        comments: number;
    };
}

// GET - Fetch user's resumable conversations
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ conversations: [], totalActive: 0 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '3');

        // Get user's conversations they've participated in or followed
        const [commentedPosts, followedPosts] = await Promise.all([
            // Posts user commented on
            prisma.comment.findMany({
                where: { authorId: user.id },
                select: { postId: true },
                distinct: ['postId'],
            }),
            // Posts user explicitly followed
            prisma.followedPost.findMany({
                where: { userId: user.id },
                select: {
                    postId: true,
                    lastViewedAt: true,
                    lastSeenCount: true
                },
            }),
        ]);

        // Combine unique post IDs
        const commentedPostIds = commentedPosts.map(c => c.postId);
        const followedPostMap = new Map<string, FollowedPostData>(
            followedPosts.map(f => [f.postId, f])
        );
        const allPostIds = [...new Set([...commentedPostIds, ...followedPostMap.keys()])];

        if (allPostIds.length === 0) {
            return NextResponse.json({ conversations: [], totalActive: 0 });
        }

        // Fetch posts with their comments and activity data
        const posts = await prisma.post.findMany({
            where: { id: { in: allPostIds } },
            include: {
                community: {
                    select: { id: true, slug: true, name: true },
                },
                author: {
                    select: { id: true, username: true },
                },
                comments: {
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        authorId: true,
                        parentId: true,
                        author: {
                            select: { id: true, username: true, image: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                },
                _count: {
                    select: { comments: true },
                },
            },
        });

        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        // Process each post to calculate resume state
        const conversations = (posts as unknown as PostData[]).map(post => {
            const followed = followedPostMap.get(post.id);
            const lastVisitAt = followed?.lastViewedAt || new Date(0);

            // Find user's comments
            const userComments = post.comments.filter(c => c.authorId === user.id);
            const userCommentIds = new Set(userComments.map(c => c.id));

            // Calculate new replies since last visit
            const newReplies = post.comments.filter(c =>
                c.createdAt > lastVisitAt && c.authorId !== user.id
            );
            const newRepliesCount = newReplies.length;

            // Direct replies to user's comments
            const directReplies = newReplies.filter(c =>
                c.parentId && userCommentIds.has(c.parentId)
            ).length;

            // Activity velocity (replies in last 30 min)
            const recentReplies = post.comments.filter(c => c.createdAt > thirtyMinutesAgo);
            const activityVelocity = recentReplies.length;

            // Last activity
            const lastActivity = post.comments[0]?.createdAt || post.createdAt;

            // Determine status
            let status: 'active' | 'heated' | 'quiet' = 'quiet';
            if (activityVelocity >= 5) {
                status = 'heated';
            } else if (activityVelocity >= 1 || recentReplies.length >= 1) {
                status = 'active';
            } else if (post.comments.filter(c => c.createdAt > twoHoursAgo).length > 0) {
                status = 'active';
            }

            // User's last comment
            const userLastComment = userComments.length > 0 ? {
                id: userComments[0].id,
                content: userComments[0].content.length > 150
                    ? userComments[0].content.slice(0, 150) + '...'
                    : userComments[0].content,
                createdAt: userComments[0].createdAt,
            } : null;

            // Preview of new replies (max 3)
            const previewReplies = newReplies.slice(0, 3).map(r => ({
                id: r.id,
                authorUsername: r.author.username,
                authorImage: r.author.image,
                content: r.content.length > 100 ? r.content.slice(0, 100) + '...' : r.content,
                createdAt: r.createdAt,
                isDirectReply: r.parentId ? userCommentIds.has(r.parentId) : false,
            }));

            return {
                postId: post.id,
                postTitle: post.title.length > 60 ? post.title.slice(0, 60) + '...' : post.title,
                communitySlug: post.community.slug,
                communityName: post.community.name,
                lastVisitAt,
                newRepliesCount,
                directReplies,
                lastActivityAt: lastActivity,
                status,
                activityVelocity,
                userLastComment,
                previewReplies,
            };
        });

        // Filter to only conversations with new activity
        const activeConversations = conversations.filter(c => c.newRepliesCount > 0);

        // Rank by: direct replies → velocity → recency
        activeConversations.sort((a, b) => {
            if (a.directReplies !== b.directReplies) {
                return b.directReplies - a.directReplies;
            }
            if (a.activityVelocity !== b.activityVelocity) {
                return b.activityVelocity - a.activityVelocity;
            }
            return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
        });

        // Return limited results with serialized dates
        const result = activeConversations.slice(0, limit).map(c => ({
            ...c,
            lastVisitAt: c.lastVisitAt.toISOString(),
            lastActivityAt: c.lastActivityAt.toISOString(),
            userLastComment: c.userLastComment ? {
                ...c.userLastComment,
                createdAt: c.userLastComment.createdAt.toISOString(),
            } : null,
            previewReplies: c.previewReplies.map(r => ({
                ...r,
                createdAt: r.createdAt.toISOString(),
            })),
        }));

        return NextResponse.json({
            conversations: result,
            totalActive: activeConversations.length,
        });

    } catch (error) {
        console.error('Error fetching resume conversations:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

// POST - Update last viewed state for a post
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { postId } = await request.json();

        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        // Get current comment count
        const commentCount = await prisma.comment.count({
            where: { postId },
        });

        // Upsert the followed post record
        await prisma.followedPost.upsert({
            where: { userId_postId: { userId: user.id, postId } },
            update: {
                lastViewedAt: new Date(),
                lastSeenCount: commentCount,
            },
            create: {
                userId: user.id,
                postId,
                lastViewedAt: new Date(),
                lastSeenCount: commentCount,
            },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error updating resume state:', error);
        return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
    }
}

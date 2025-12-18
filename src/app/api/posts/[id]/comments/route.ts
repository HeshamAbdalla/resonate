import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';
import { detectDisagreementServer } from '@/lib/disagreementServer';
import { processMentions } from '@/lib/mentions';

// Get comments for a post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;

        const comments = await prisma.comment.findMany({
            where: {
                postId,
                parentId: null, // Only top-level comments
            },
            orderBy: { score: 'desc' },
            include: {
                author: {
                    select: { username: true, reputation: true, image: true, hasPostedFirstComment: true },
                },
                children: {
                    include: {
                        author: {
                            select: { username: true, reputation: true, image: true },
                        },
                        children: {
                            include: {
                                author: {
                                    select: { username: true, reputation: true, image: true },
                                },
                            },
                        },
                    },
                    orderBy: { score: 'desc' },
                },
            },
        });

        return NextResponse.json({ comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

// Create a comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user profile exists
        let userProfile = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!userProfile) {
            const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
            userProfile = await prisma.user.create({
                data: {
                    id: user.id,
                    username: `${username}_${Date.now().toString(36)}`,
                },
            });
        }

        const body = await request.json();
        const { content, parentId } = body;

        if (!content || content.trim().length < 1) {
            return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
        }

        if (content.length > 10000) {
            return NextResponse.json({ error: 'Comment cannot exceed 10,000 characters' }, { status: 400 });
        }

        // Verify post exists and get community info
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                title: true,
                communityId: true,
                isLocked: true,
                commentsDisabled: true,
                community: {
                    select: { creatorId: true }
                }
            },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Check if comments are disabled
        if (post.isLocked || post.commentsDisabled) {
            return NextResponse.json({ error: 'Comments are disabled on this post' }, { status: 403 });
        }

        // Check if user is a member (creator or subscriber)
        const isCreator = post.community.creatorId === user.id;
        const subscription = await prisma.subscription.findUnique({
            where: {
                userId_communityId: {
                    userId: user.id,
                    communityId: post.communityId,
                },
            },
        });

        if (!isCreator && !subscription) {
            return NextResponse.json({
                error: 'You must join this community before commenting'
            }, { status: 403 });
        }

        // Check if this is the user's first comment ever
        const isFirstComment = !userProfile.hasPostedFirstComment;

        // Detect if this is a good-faith disagreement (for replies)
        const disagreementResult = detectDisagreementServer(content.trim());
        const isDisagreement = parentId ? disagreementResult.isGoodFaith : false;

        // If this is a disagreement reply, check if the parent comment author
        // is receiving their first disagrement
        let isFirstDisagreementForRecipient = false;
        if (isDisagreement && parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: parentId },
                include: { author: { select: { id: true, hasReceivedFirstDisagreement: true } } },
            });

            if (parentComment && !parentComment.author.hasReceivedFirstDisagreement) {
                isFirstDisagreementForRecipient = true;
                // Mark the parent author as having received their first disagreement
                await prisma.user.update({
                    where: { id: parentComment.author.id },
                    data: { hasReceivedFirstDisagreement: true },
                });
            }
        }

        // Create the comment
        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                authorId: user.id,
                postId,
                parentId: parentId || null,
                upvotes: 1,
                score: 1,
            },
            include: {
                author: {
                    select: { username: true, reputation: true },
                },
            },
        });

        // Auto-upvote by author
        await prisma.commentVote.create({
            data: {
                userId: user.id,
                commentId: comment.id,
                type: 'UP',
            },
        });

        // Mark user as having posted their first comment
        if (isFirstComment) {
            await prisma.user.update({
                where: { id: user.id },
                data: { hasPostedFirstComment: true },
            });
        }

        // Process @mentions in the comment
        await processMentions({
            content: content.trim(),
            mentionerId: user.id,
            sourceType: 'comment',
            sourceId: comment.id,
            contextTitle: post.title,
        });

        return NextResponse.json({
            id: comment.id,
            message: 'Comment created successfully',
            comment,
            isFirstComment, // For "New Voice" highlighting
            isDisagreement, // For "Different perspective" badge
            isFirstDisagreementForRecipient, // For first disagreement microcopy
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}


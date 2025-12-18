import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Vote on a post
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

        const body = await request.json();
        const { type } = body; // 'UP' or 'DOWN'

        if (!type || !['UP', 'DOWN'].includes(type)) {
            return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
        }

        // Check if post exists and get author
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true, upvotes: true, downvotes: true, score: true, authorId: true },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Check for existing vote
        const existingVote = await prisma.postVote.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId,
                },
            },
        });

        let newScore = post.score;
        let newUpvotes = post.upvotes;
        let newDownvotes = post.downvotes;
        let reputationChange = 0; // Track reputation change for author

        if (existingVote) {
            if (existingVote.type === type) {
                // Remove vote (toggle off)
                await prisma.postVote.delete({
                    where: { id: existingVote.id },
                });

                if (type === 'UP') {
                    newUpvotes -= 1;
                    newScore -= 1;
                    reputationChange = -1; // Author loses reputation
                } else {
                    newDownvotes -= 1;
                    newScore += 1;
                    reputationChange = 1; // Author gains back reputation
                }
            } else {
                // Change vote direction
                await prisma.postVote.update({
                    where: { id: existingVote.id },
                    data: { type },
                });

                if (type === 'UP') {
                    newUpvotes += 1;
                    newDownvotes -= 1;
                    newScore += 2;
                    reputationChange = 2; // Author gains reputation (was -1, now +1 = +2)
                } else {
                    newUpvotes -= 1;
                    newDownvotes += 1;
                    newScore -= 2;
                    reputationChange = -2; // Author loses reputation
                }
            }
        } else {
            // Create new vote
            await prisma.postVote.create({
                data: {
                    userId: user.id,
                    postId,
                    type,
                },
            });

            if (type === 'UP') {
                newUpvotes += 1;
                newScore += 1;
                reputationChange = 1; // Author gains reputation
            } else {
                newDownvotes += 1;
                newScore -= 1;
                reputationChange = -1; // Author loses reputation
            }
        }

        // Update post score
        await prisma.post.update({
            where: { id: postId },
            data: {
                upvotes: newUpvotes,
                downvotes: newDownvotes,
                score: newScore,
            },
        });

        // Update author's reputation (don't let it go below 0)
        if (reputationChange !== 0 && post.authorId !== user.id) {
            await prisma.user.update({
                where: { id: post.authorId },
                data: {
                    reputation: {
                        increment: reputationChange,
                    },
                },
            });
        }

        return NextResponse.json({
            score: newScore,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: existingVote?.type === type ? null : type,
        });
    } catch (error) {
        console.error('Error voting on post:', error);
        return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }
}

// Get user's vote on a post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ userVote: null });
        }

        const vote = await prisma.postVote.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId,
                },
            },
        });

        return NextResponse.json({ userVote: vote?.type || null });
    } catch (error) {
        console.error('Error fetching vote:', error);
        return NextResponse.json({ userVote: null });
    }
}

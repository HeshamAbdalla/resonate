import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: commentId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type } = await request.json();

        if (!type || !['UP', 'DOWN'].includes(type)) {
            return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
        }

        // Get the comment
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true, authorId: true, score: true }
        });

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        // Check for existing vote
        const existingVote = await prisma.commentVote.findUnique({
            where: {
                userId_commentId: {
                    userId: user.id,
                    commentId
                }
            }
        });

        let scoreChange = 0;
        let newVote: { type: string } | null = null;

        if (existingVote) {
            if (existingVote.type === type) {
                // Same vote - remove it (toggle off)
                await prisma.commentVote.delete({
                    where: { id: existingVote.id }
                });
                scoreChange = type === 'UP' ? -1 : 1;
                newVote = null;
            } else {
                // Different vote - change it
                await prisma.commentVote.update({
                    where: { id: existingVote.id },
                    data: { type }
                });
                scoreChange = type === 'UP' ? 2 : -2;
                newVote = { type };
            }
        } else {
            // New vote
            await prisma.commentVote.create({
                data: {
                    userId: user.id,
                    commentId,
                    type
                }
            });
            scoreChange = type === 'UP' ? 1 : -1;
            newVote = { type };
        }

        // Update comment score
        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { score: { increment: scoreChange } },
            select: { score: true }
        });

        // Update author reputation if different user
        if (comment.authorId !== user.id && scoreChange !== 0) {
            await prisma.user.update({
                where: { id: comment.authorId },
                data: { reputation: { increment: scoreChange } }
            });
        }

        return NextResponse.json({
            score: updatedComment.score,
            userVote: newVote?.type || null
        });
    } catch (error) {
        console.error('Error voting on comment:', error);
        return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }
}

// GET - Get user's vote on a comment
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: commentId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ userVote: null });
        }

        const vote = await prisma.commentVote.findUnique({
            where: {
                userId_commentId: {
                    userId: user.id,
                    commentId
                }
            },
            select: { type: true }
        });

        return NextResponse.json({ userVote: vote?.type || null });
    } catch (error) {
        console.error('Error getting vote:', error);
        return NextResponse.json({ userVote: null });
    }
}

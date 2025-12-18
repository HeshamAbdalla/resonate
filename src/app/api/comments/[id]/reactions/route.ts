import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

// POST - Add, swap, or remove a reaction (ONE per user per comment)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: commentId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            console.error('Auth error:', authError);
        }

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { emoji } = await request.json();

        if (!emoji || typeof emoji !== 'string') {
            return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
        }

        // Check if comment exists
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true }
        });

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        // Get user's EXISTING reaction (if any) for this comment
        const existingReaction = await prisma.commentReaction.findFirst({
            where: {
                userId: user.id,
                commentId
            }
        });

        let action: 'added' | 'removed' | 'swapped' = 'added';

        if (existingReaction) {
            if (existingReaction.emoji === emoji) {
                // Same emoji - REMOVE (toggle off)
                await prisma.commentReaction.delete({
                    where: { id: existingReaction.id }
                });
                action = 'removed';
            } else {
                // Different emoji - SWAP (update existing)
                await prisma.commentReaction.update({
                    where: { id: existingReaction.id },
                    data: { emoji }
                });
                action = 'swapped';
            }
        } else {
            // No existing reaction - ADD new one
            await prisma.commentReaction.create({
                data: {
                    userId: user.id,
                    commentId,
                    emoji
                }
            });
            action = 'added';
        }

        // Get updated reaction counts
        const reactions = await prisma.commentReaction.groupBy({
            by: ['emoji'],
            where: { commentId },
            _count: { emoji: true }
        });

        // Get user's current reaction (single, not array)
        const userReaction = await prisma.commentReaction.findFirst({
            where: { commentId, userId: user.id },
            select: { emoji: true }
        });

        const reactionCounts: Record<string, number> = {};
        reactions.forEach(r => {
            reactionCounts[r.emoji] = r._count.emoji;
        });

        return NextResponse.json({
            reactions: reactionCounts,
            userReaction: userReaction?.emoji || null, // Single reaction, not array
            action
        });
    } catch (error) {
        console.error('Error with reaction:', error);
        return NextResponse.json({ error: 'Failed to react' }, { status: 500 });
    }
}

// GET - Get reactions for a comment
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: commentId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get reaction counts
        const reactions = await prisma.commentReaction.groupBy({
            by: ['emoji'],
            where: { commentId },
            _count: { emoji: true }
        });

        const reactionCounts: Record<string, number> = {};
        reactions.forEach(r => {
            reactionCounts[r.emoji] = r._count.emoji;
        });

        // Get user's reaction (single) if logged in
        let userReaction: string | null = null;
        if (user) {
            const userReactionData = await prisma.commentReaction.findFirst({
                where: { commentId, userId: user.id },
                select: { emoji: true }
            });
            userReaction = userReactionData?.emoji || null;
        }

        return NextResponse.json({
            reactions: reactionCounts,
            userReaction // Single reaction, not array
        });
    } catch (error) {
        console.error('Error getting reactions:', error);
        return NextResponse.json({ reactions: {}, userReaction: null });
    }
}

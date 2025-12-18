import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

// POST - Add, swap, or remove a reaction (ONE per user per post)
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

        const { emoji } = await request.json();

        if (!emoji || typeof emoji !== 'string') {
            return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
        }

        // Check if post exists
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true }
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Get user's EXISTING reaction (if any) for this post
        const existingReaction = await prisma.postReaction.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId
                }
            }
        });

        let action: 'added' | 'removed' | 'swapped' = 'added';

        if (existingReaction) {
            if (existingReaction.emoji === emoji) {
                // Same emoji - REMOVE (toggle off)
                await prisma.postReaction.delete({
                    where: { id: existingReaction.id }
                });
                action = 'removed';
            } else {
                // Different emoji - SWAP (update existing)
                await prisma.postReaction.update({
                    where: { id: existingReaction.id },
                    data: { emoji }
                });
                action = 'swapped';
            }
        } else {
            // No existing reaction - ADD new one
            await prisma.postReaction.create({
                data: {
                    userId: user.id,
                    postId,
                    emoji
                }
            });
            action = 'added';
        }

        // Get updated reaction counts
        const reactions = await prisma.postReaction.groupBy({
            by: ['emoji'],
            where: { postId },
            _count: { emoji: true }
        });

        // Get user's current reaction (single, not array)
        const userReaction = await prisma.postReaction.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId
                }
            },
            select: { emoji: true }
        });

        const reactionCounts: Record<string, number> = {};
        reactions.forEach(r => {
            reactionCounts[r.emoji] = r._count.emoji;
        });

        return NextResponse.json({
            reactions: reactionCounts,
            userReaction: userReaction?.emoji || null,
            action
        });
    } catch (error) {
        console.error('Error with post reaction:', error);
        return NextResponse.json({ error: 'Failed to react' }, { status: 500 });
    }
}

// GET - Get reactions for a post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get reaction counts
        const reactions = await prisma.postReaction.groupBy({
            by: ['emoji'],
            where: { postId },
            _count: { emoji: true }
        });

        const reactionCounts: Record<string, number> = {};
        reactions.forEach(r => {
            reactionCounts[r.emoji] = r._count.emoji;
        });

        // Get user's reaction if logged in
        let userReaction: string | null = null;
        if (user) {
            const userReactionData = await prisma.postReaction.findUnique({
                where: {
                    userId_postId: {
                        userId: user.id,
                        postId
                    }
                },
                select: { emoji: true }
            });
            userReaction = userReactionData?.emoji || null;
        }

        return NextResponse.json({
            reactions: reactionCounts,
            userReaction
        });
    } catch (error) {
        console.error('Error getting post reactions:', error);
        return NextResponse.json({ reactions: {}, userReaction: null });
    }
}

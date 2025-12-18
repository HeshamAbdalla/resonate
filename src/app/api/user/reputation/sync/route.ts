import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// POST - Recalculate and sync user's reputation based on their posts and comments
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Calculate total score from all posts
        const postScores = await prisma.post.aggregate({
            where: { authorId: user.id },
            _sum: { score: true },
        });

        // Calculate total score from all comments
        const commentScores = await prisma.comment.aggregate({
            where: { authorId: user.id },
            _sum: { score: true },
        });

        const totalReputation = (postScores._sum.score || 0) + (commentScores._sum.score || 0);

        // Update user's reputation
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { reputation: Math.max(0, totalReputation) },
            select: { reputation: true },
        });

        return NextResponse.json({
            reputation: updatedUser.reputation,
            postScore: postScores._sum.score || 0,
            commentScore: commentScores._sum.score || 0,
            message: 'Reputation synced successfully',
        });
    } catch (error) {
        console.error('Error syncing reputation:', error);
        return NextResponse.json({ error: 'Failed to sync reputation' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Get user's comments
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const comments = await prisma.comment.findMany({
            where: { authorId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        community: {
                            select: {
                                slug: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            comments: comments.map((c: any) => ({
                id: c.id,
                content: c.content,
                score: c.score,
                createdAt: c.createdAt.toISOString(),
                post: c.post,
            }))
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

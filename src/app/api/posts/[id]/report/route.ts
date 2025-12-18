import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Report a post
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
        const { reason, details } = body;

        if (!reason) {
            return NextResponse.json({ error: 'Please select a reason' }, { status: 400 });
        }

        // Get the post
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                communityId: true,
                authorId: true,
            },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Can't report your own post
        if (post.authorId === user.id) {
            return NextResponse.json({ error: 'You cannot report your own post' }, { status: 400 });
        }

        // Check if already reported by this user
        const existingReport = await prisma.report.findFirst({
            where: {
                reporterId: user.id,
                targetType: 'post',
                targetId: postId,
                status: 'pending',
            },
        });

        if (existingReport) {
            return NextResponse.json({ error: 'You have already reported this post' }, { status: 400 });
        }

        // Create the report for Open Court
        await prisma.report.create({
            data: {
                reporterId: user.id,
                targetType: 'post',
                targetId: postId,
                reason,
                description: details || null,
            },
        });

        // Also log as mod action for community mods
        await prisma.modAction.create({
            data: {
                communityId: post.communityId,
                moderatorId: user.id,
                action: 'report_post',
                targetType: 'post',
                targetId: postId,
                reason: `${reason}${details ? ': ' + details : ''}`,
                isPublic: false,
            },
        });

        return NextResponse.json({
            message: 'Post reported successfully. It will be reviewed by the community.',
        });
    } catch (error) {
        console.error('Error reporting post:', error);
        return NextResponse.json({ error: 'Failed to report post' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Report a comment
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

        const body = await request.json();
        const { reason, details } = body;

        if (!reason) {
            return NextResponse.json({ error: 'Please select a reason' }, { status: 400 });
        }

        // Get the comment
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
                id: true,
                authorId: true,
                post: {
                    select: { communityId: true },
                },
            },
        });

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        // Can't report your own comment
        if (comment.authorId === user.id) {
            return NextResponse.json({ error: 'You cannot report your own comment' }, { status: 400 });
        }

        // Check if already reported by this user
        const existingReport = await prisma.report.findFirst({
            where: {
                reporterId: user.id,
                targetType: 'comment',
                targetId: commentId,
                status: 'pending',
            },
        });

        if (existingReport) {
            return NextResponse.json({ error: 'You have already reported this comment' }, { status: 400 });
        }

        // Create the report for Open Court
        await prisma.report.create({
            data: {
                reporterId: user.id,
                targetType: 'comment',
                targetId: commentId,
                reason,
                description: details || null,
            },
        });

        // Also log as mod action for community mods
        await prisma.modAction.create({
            data: {
                communityId: comment.post.communityId,
                moderatorId: user.id,
                action: 'report_comment',
                targetType: 'comment',
                targetId: commentId,
                reason: `${reason}${details ? ': ' + details : ''}`,
                isPublic: false,
            },
        });

        return NextResponse.json({
            message: 'Comment reported successfully. It will be reviewed by the community.',
        });
    } catch (error) {
        console.error('Error reporting comment:', error);
        return NextResponse.json({ error: 'Failed to report comment' }, { status: 500 });
    }
}

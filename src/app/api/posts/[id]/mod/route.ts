import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';
import { isModeratorOf } from '@/lib/moderation';

// Mod actions on a post
export async function PATCH(
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

        // Get the post and check mod permissions
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                isPinnedInCommunity: true,
                isLocked: true,
                isNSFW: true,
                community: {
                    select: { id: true, creatorId: true, slug: true },
                },
            },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Check if user is a moderator (creator, admin, or mod)
        const isMod = await isModeratorOf(post.community.id, user.id);

        if (!isMod) {
            return NextResponse.json({ error: 'Only moderators can perform this action' }, { status: 403 });
        }

        const body = await request.json();
        const { action } = body;

        let updateData: any = {};
        let modActionType = '';
        let message = '';

        switch (action) {
            case 'togglePin':
                updateData.isPinnedInCommunity = !post.isPinnedInCommunity;
                modActionType = updateData.isPinnedInCommunity ? 'pin_post' : 'unpin_post';
                message = updateData.isPinnedInCommunity ? 'Post pinned to community' : 'Post unpinned';
                break;

            case 'toggleLock':
                updateData.isLocked = !post.isLocked;
                modActionType = updateData.isLocked ? 'lock_comments' : 'unlock_comments';
                message = updateData.isLocked ? 'Comments locked' : 'Comments unlocked';
                break;

            case 'toggleNSFW':
                updateData.isNSFW = !post.isNSFW;
                modActionType = updateData.isNSFW ? 'mark_nsfw' : 'unmark_nsfw';
                message = updateData.isNSFW ? 'Post marked as NSFW' : 'NSFW mark removed';
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Update the post
        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: updateData,
            select: {
                id: true,
                isPinnedInCommunity: true,
                isLocked: true,
                isNSFW: true,
            },
        });

        // Log the mod action for transparency
        await prisma.modAction.create({
            data: {
                communityId: post.community.id,
                moderatorId: user.id,
                action: modActionType,
                targetType: 'post',
                targetId: postId,
                reason: message,
                isPublic: true,
            },
        });

        return NextResponse.json({
            message,
            post: updatedPost,
        });
    } catch (error: any) {
        console.error('Error performing mod action:', error);
        console.error('Error details:', error?.message, error?.code);
        return NextResponse.json({
            error: 'Failed to perform mod action',
            details: error?.message
        }, { status: 500 });
    }
}

// Get post mod status
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                isPinnedInCommunity: true,
                isLocked: true,
                isNSFW: true,
            },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json({ post });
    } catch (error) {
        console.error('Error fetching post status:', error);
        return NextResponse.json({ error: 'Failed to fetch post status' }, { status: 500 });
    }
}

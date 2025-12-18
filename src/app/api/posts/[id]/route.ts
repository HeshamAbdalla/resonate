import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Delete a post (author or mod)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const { searchParams } = new URL(request.url);
        const reason = searchParams.get('reason') || 'Violated community guidelines';

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the post and its community
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                community: {
                    select: { id: true, creatorId: true, slug: true },
                },
            },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const isAuthor = post.authorId === user.id;
        const isMod = post.community.creatorId === user.id;

        // Check if user is the author or a mod
        if (!isAuthor && !isMod) {
            return NextResponse.json({ error: 'You cannot delete this post' }, { status: 403 });
        }

        // If mod (not author) is deleting, log the action for transparency
        if (isMod && !isAuthor) {
            await prisma.modAction.create({
                data: {
                    communityId: post.community.id,
                    moderatorId: user.id,
                    action: 'remove_post',
                    targetType: 'post',
                    targetId: postId,
                    reason: reason,
                    isPublic: true,
                },
            });
        }

        // Delete the post
        await prisma.post.delete({
            where: { id: postId },
        });

        return NextResponse.json({
            message: 'Post deleted successfully',
            communitySlug: post.community.slug,
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}

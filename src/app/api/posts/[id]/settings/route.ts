import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Update post settings (edit, pin, disable comments)
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

        // Get the post
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true, isPinned: true, commentsDisabled: true },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Only author can update
        if (post.authorId !== user.id) {
            return NextResponse.json({ error: 'You can only edit your own posts' }, { status: 403 });
        }

        const body = await request.json();
        const { action, title, content } = body;

        let updateData: any = {};
        let message = '';

        switch (action) {
            case 'edit':
                if (title) {
                    if (title.length > 300) {
                        return NextResponse.json({ error: 'Title cannot exceed 300 characters' }, { status: 400 });
                    }
                    if (title.length < 3) {
                        return NextResponse.json({ error: 'Title must be at least 3 characters' }, { status: 400 });
                    }
                    updateData.title = title.trim();
                }
                if (content !== undefined) {
                    if (content && content.length > 40000) {
                        return NextResponse.json({ error: 'Content cannot exceed 40,000 characters' }, { status: 400 });
                    }
                    updateData.content = content?.trim() || null;
                }
                message = 'Post updated';
                break;

            case 'togglePin':
                updateData.isPinned = !post.isPinned;
                message = updateData.isPinned ? 'Post pinned to profile' : 'Post unpinned';
                break;

            case 'toggleComments':
                updateData.commentsDisabled = !post.commentsDisabled;
                message = updateData.commentsDisabled ? 'Comments disabled' : 'Comments enabled';
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: updateData,
            select: {
                id: true,
                title: true,
                content: true,
                isPinned: true,
                commentsDisabled: true,
            },
        });

        return NextResponse.json({
            message,
            post: updatedPost,
        });
    } catch (error) {
        console.error('Error updating post:', error);
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}

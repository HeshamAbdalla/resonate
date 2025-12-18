import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Toggle save post
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

        // Check if already saved
        const existingSave = await prisma.savedPost.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId,
                },
            },
        });

        if (existingSave) {
            // Unsave
            await prisma.savedPost.delete({
                where: { id: existingSave.id },
            });
            return NextResponse.json({ saved: false, message: 'Post unsaved' });
        } else {
            // Save
            await prisma.savedPost.create({
                data: {
                    userId: user.id,
                    postId,
                },
            });
            return NextResponse.json({ saved: true, message: 'Post saved' });
        }
    } catch (error) {
        console.error('Error saving post:', error);
        return NextResponse.json({ error: 'Failed to save post' }, { status: 500 });
    }
}

// Check if post is saved
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ saved: false });
        }

        const saved = await prisma.savedPost.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId,
                },
            },
        });

        return NextResponse.json({ saved: !!saved });
    } catch (error) {
        console.error('Error checking saved status:', error);
        return NextResponse.json({ saved: false });
    }
}

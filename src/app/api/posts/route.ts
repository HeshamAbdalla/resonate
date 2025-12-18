import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// POST - Create a new post
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, type, url, communityId } = body;

        // Validation
        if (!title || title.trim().length < 3) {
            return NextResponse.json({ error: 'Title must be at least 3 characters' }, { status: 400 });
        }

        if (!communityId) {
            return NextResponse.json({ error: 'Please select a community' }, { status: 400 });
        }

        // Check if community exists
        const community = await prisma.community.findUnique({
            where: { id: communityId },
            select: { id: true, slug: true },
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Create the post
        const post = await prisma.post.create({
            data: {
                title: title.trim(),
                content: content || null,
                type: type || 'text',
                url: url || null,
                authorId: user.id,
                communityId: community.id,
            },
            include: {
                author: { select: { username: true } },
                community: { select: { slug: true } },
            },
        });

        return NextResponse.json({
            id: post.id,
            slug: post.id, // Using post ID as slug
            communitySlug: post.community.slug,
            message: 'Post created successfully',
        });
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}

// GET - List posts (optional, for feed)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const communitySlug = searchParams.get('communitySlug');
        const sort = searchParams.get('sort') || 'hot';

        const where = communitySlug ? {
            community: { slug: communitySlug }
        } : {};

        const orderBy = sort === 'new'
            ? { createdAt: 'desc' as const }
            : sort === 'top'
                ? { score: 'desc' as const }
                : { score: 'desc' as const }; // hot

        const posts = await prisma.post.findMany({
            where,
            orderBy,
            take: limit,
            skip: offset,
            include: {
                author: { select: { username: true, reputation: true } },
                community: { select: { slug: true, name: true } },
                _count: { select: { comments: true } },
            },
        });

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

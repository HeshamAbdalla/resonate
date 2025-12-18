import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user profile exists in database
        let userProfile = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!userProfile) {
            // Create user profile if it doesn't exist
            const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
            userProfile = await prisma.user.create({
                data: {
                    id: user.id,
                    username: `${username}_${Date.now().toString(36)}`, // Ensure unique
                },
            });
        }

        const body = await request.json();
        const { name, slug, description, bannerImage, iconImage } = body;

        // Validate required fields
        if (!name || name.length < 3) {
            return NextResponse.json({ error: 'Name must be at least 3 characters' }, { status: 400 });
        }

        if (!slug || slug.length < 3) {
            return NextResponse.json({ error: 'Slug must be at least 3 characters' }, { status: 400 });
        }

        // Check slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: 'Slug can only contain lowercase letters, numbers, and hyphens' }, { status: 400 });
        }

        // Check if slug already exists
        const existingSlug = await prisma.community.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (existingSlug) {
            return NextResponse.json({ error: 'A community with this URL already exists' }, { status: 400 });
        }

        // Check if name already exists
        const existingName = await prisma.community.findUnique({
            where: { name },
            select: { id: true },
        });

        if (existingName) {
            return NextResponse.json({ error: 'A community with this name already exists' }, { status: 400 });
        }

        // Create the community
        const community = await prisma.community.create({
            data: {
                name,
                slug,
                description: description || null,
                bannerImage: bannerImage || null,
                iconImage: iconImage || null,
                creatorId: user.id,
            },
        });

        // Auto-subscribe the creator to the community
        await prisma.subscription.create({
            data: {
                userId: user.id,
                communityId: community.id,
            },
        });

        return NextResponse.json({
            id: community.id,
            name: community.name,
            slug: community.slug,
            message: 'Community created successfully!',
        });
    } catch (error) {
        console.error('Error creating community:', error);
        return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
    }
}

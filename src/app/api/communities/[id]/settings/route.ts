import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get community and verify ownership
        const community = await prisma.community.findUnique({
            where: { id },
            select: { id: true, creatorId: true, name: true },
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        if (community.creatorId !== user.id) {
            return NextResponse.json({ error: 'Only the creator can edit settings' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, bannerImage, iconImage, rules } = body;

        // Validate name
        if (name && name.length < 3) {
            return NextResponse.json({ error: 'Name must be at least 3 characters' }, { status: 400 });
        }

        // Check if name is taken by another community
        if (name && name !== community.name) {
            const existing = await prisma.community.findUnique({
                where: { name },
                select: { id: true },
            });
            if (existing && existing.id !== id) {
                return NextResponse.json({ error: 'Community name already taken' }, { status: 400 });
            }
        }

        // Update community
        const updated = await prisma.community.update({
            where: { id },
            data: {
                name: name || undefined,
                description: description,
                bannerImage: bannerImage,
                iconImage: iconImage,
                rules: rules,
            },
        });

        // Log the mod action
        await prisma.modAction.create({
            data: {
                communityId: id,
                moderatorId: user.id,
                action: 'update_settings',
                reason: 'Updated community settings',
                isPublic: true,
            },
        });

        return NextResponse.json({
            message: 'Settings updated successfully',
            community: updated,
        });
    } catch (error) {
        console.error('Error updating community settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const community = await prisma.community.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { id: true, username: true },
                },
                _count: {
                    select: { subscribers: true, posts: true },
                },
            },
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        return NextResponse.json(community);
    } catch (error) {
        console.error('Error fetching community:', error);
        return NextResponse.json({ error: 'Failed to fetch community' }, { status: 500 });
    }
}

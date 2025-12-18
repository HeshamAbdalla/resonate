import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Get user profile
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                username: true,
                name: true,
                bio: true,
                image: true,
                bannerImage: true,
                reputation: true,
                createdAt: true,
            },
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ profile });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// Update user profile
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, bio, image, bannerImage } = body;

        // Validate bio length
        if (bio && bio.length > 200) {
            return NextResponse.json({ error: 'Bio must be 200 characters or less' }, { status: 400 });
        }

        const updatedProfile = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: name !== undefined ? name?.trim() || null : undefined,
                bio: bio !== undefined ? bio?.trim() || null : undefined,
                image: image !== undefined ? image : undefined,
                bannerImage: bannerImage !== undefined ? bannerImage : undefined,
            },
            select: {
                id: true,
                username: true,
                name: true,
                bio: true,
                image: true,
                bannerImage: true,
            },
        });

        return NextResponse.json({
            profile: updatedProfile,
            message: 'Profile updated successfully',
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

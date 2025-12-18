import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Get current user info including profile data
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ userId: null, authenticated: false });
        }

        // Fetch profile from database to get image and username
        const profile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                username: true,
                image: true,
                name: true,
            },
        });

        return NextResponse.json({
            userId: user.id,
            email: user.email,
            authenticated: true,
            user: profile ? {
                username: profile.username,
                image: profile.image,
                name: profile.name,
            } : null,
        });
    } catch (error) {
        console.error('Error getting user:', error);
        return NextResponse.json({ userId: null, authenticated: false });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET - Check if user is a member of the community
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isMember: false });
        }

        const { id } = await context.params;

        // Find community by ID or slug
        const community = await prisma.community.findFirst({
            where: {
                OR: [{ id }, { slug: id }],
            },
            select: { id: true },
        });

        if (!community) {
            return NextResponse.json({ isMember: false });
        }

        // Check subscription
        const subscription = await prisma.subscription.findUnique({
            where: {
                userId_communityId: {
                    userId: user.id,
                    communityId: community.id,
                },
            },
        });

        return NextResponse.json({ isMember: !!subscription });
    } catch (error) {
        console.error('Error checking membership:', error);
        return NextResponse.json({ isMember: false });
    }
}

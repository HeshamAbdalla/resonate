import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Check if user is subscribed
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');

    if (!communityId) {
        return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ subscribed: false, userId: null });
    }

    const subscription = await prisma.subscription.findUnique({
        where: {
            userId_communityId: {
                userId: user.id,
                communityId,
            },
        },
    });

    return NextResponse.json({ subscribed: !!subscription, userId: user.id });
}

// Subscribe to community
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { communityId } = body;

    if (!communityId) {
        return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
    }

    // Ensure user profile exists
    let userProfile = await prisma.user.findUnique({
        where: { id: user.id },
    });

    if (!userProfile) {
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
        userProfile = await prisma.user.create({
            data: {
                id: user.id,
                username: `${username}_${Date.now().toString(36)}`,
            },
        });
    }

    // Check if already subscribed
    const existing = await prisma.subscription.findUnique({
        where: {
            userId_communityId: {
                userId: user.id,
                communityId,
            },
        },
    });

    if (existing) {
        return NextResponse.json({ message: 'Already subscribed' });
    }

    await prisma.subscription.create({
        data: {
            userId: user.id,
            communityId,
        },
    });

    return NextResponse.json({ message: 'Subscribed successfully' });
}

// Unsubscribe from community
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');

    if (!communityId) {
        return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
    }

    await prisma.subscription.deleteMany({
        where: {
            userId: user.id,
            communityId,
        },
    });

    return NextResponse.json({ message: 'Unsubscribed successfully' });
}

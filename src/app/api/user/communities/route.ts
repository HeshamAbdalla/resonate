import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Get communities the current user is subscribed to
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ communities: [] });
        }

        // Get user's subscriptions with community details
        const subscriptions = await prisma.subscription.findMany({
            where: { userId: user.id },
            include: {
                community: {
                    include: {
                        _count: {
                            select: { subscribers: true },
                        },
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });

        // Also include communities the user created (they're automatically a member)
        const createdCommunities = await prisma.community.findMany({
            where: { creatorId: user.id },
            include: {
                _count: {
                    select: { subscribers: true },
                },
            },
        });

        // Combine and deduplicate
        const subscribedCommunities = subscriptions.map((s: typeof subscriptions[number]) => ({
            id: s.community.id,
            name: s.community.name,
            slug: s.community.slug,
            iconImage: s.community.iconImage,
            _count: { subscribers: s.community._count.subscribers },
            isCreator: false,
        }));

        const ownedCommunities = createdCommunities.map((c: typeof createdCommunities[number]) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            iconImage: c.iconImage,
            _count: { subscribers: c._count.subscribers },
            isCreator: true,
        }));

        // Merge, with owned communities at the top
        const allCommunityIds = new Set<string>();
        const communities = [];

        // Add owned first
        for (const c of ownedCommunities) {
            if (!allCommunityIds.has(c.id)) {
                allCommunityIds.add(c.id);
                communities.push(c);
            }
        }

        // Then subscribed
        for (const c of subscribedCommunities) {
            if (!allCommunityIds.has(c.id)) {
                allCommunityIds.add(c.id);
                communities.push(c);
            }
        }

        return NextResponse.json({ communities });
    } catch (error) {
        console.error('Error fetching user communities:', error);
        return NextResponse.json({ communities: [] });
    }
}

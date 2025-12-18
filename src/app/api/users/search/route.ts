import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// GET - Search users for @mention autocomplete
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.toLowerCase() || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

        if (query.length < 1) {
            return NextResponse.json({ users: [] });
        }

        // Search users by username or name
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                ],
                id: { not: user.id }, // Exclude current user
            },
            select: {
                id: true,
                username: true,
                name: true,
                image: true,
            },
            take: limit,
            orderBy: [
                // Prioritize exact username matches
                { username: 'asc' },
            ],
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error searching users:', error);
        return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }
}

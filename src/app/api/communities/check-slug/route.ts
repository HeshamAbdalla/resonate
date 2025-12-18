import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug || slug.length < 3) {
        return NextResponse.json({ available: false, error: 'Slug must be at least 3 characters' });
    }

    try {
        const existing = await prisma.community.findUnique({
            where: { slug },
            select: { id: true },
        });

        return NextResponse.json({ available: !existing });
    } catch (error) {
        console.error('Error checking slug:', error);
        return NextResponse.json({ available: false, error: 'Failed to check slug' }, { status: 500 });
    }
}

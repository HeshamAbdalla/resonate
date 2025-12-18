export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getRisingPosts } from '@/lib/actions/posts';

export async function GET() {
    try {
        const posts = await getRisingPosts(20);
        return NextResponse.json(posts);
    } catch (error) {
        console.error('Failed to fetch rising posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}
